
/**
 * @imports
 */
import Fs from 'fs';
import Url from 'url';
import Path from 'path';
import Jsdom from 'jsdom';
import { compileFunction, runInContext } from 'vm';
import { SubscriptFunction } from '@webqit/subscript';
import SelectiveResourceLoader from './SelectiveResourceLoader.js';

/**
 * Creates a DOM instance.
 * 
 * @param string source
 * @param object params
 * 
 * @return Jsdom.JSDOM
 */
export function createWindow(source, params = {}) {
    var domIsMarkup = source.trim().startsWith('<');
    if (!domIsMarkup && source && !Fs.existsSync(source)) {
        throw new Error('The document filename "' + source + '" does not exist.');
    }
    if (!params.url) { throw new Error('Document URL must be given in params.url.'); }
    // -----------
    // Window setup
    // -----------
    const URL = Url.parse(params.url);
    const jsdomInstance = new Jsdom.JSDOM(domIsMarkup ? source : (source ? Fs.readFileSync(source).toString() : ''), {
        url: params.url,
        contentType: 'text/html',
        pretendToBeVisual: params.pseudovisual_mode !== false,
        resources: new SelectiveResourceLoader({
            strictSSL: false,
            userAgent: params.user_agent || '@webqit/oohtml-ssr',
        }),
        runScripts: 'dangerously',
        beforeParse(window) {
            // -------------
            // Prox relative URLs
            // -------------
            window.fetch = (url, options) => {
                url = url.trim();
                if (url.startsWith('//')) { url = URL.protocol + url; }
                else if (!url.startsWith('http')) {
                    if (url.startsWith('/')) { url = URL.protocol + '//' + URL.host + url; }
                    else { url = URL.protocol + '//' + URL.host + Path.join(URL.path.toLowerCase(), url).replace(/\\/g, '/'); }
                }
                if (params.log_fetch) { console.log('[FETCH]: ' + url); }
                return fetch(url, options);
            };
            // -------------
            // Scoped JS?
            // -------------
            window.webqit = { oohtml: { configs: { SCOPED_JS: { SubscriptFunction, advanced: { runtimeParams: {
                compileFunction: (code, parameters) => {
                    const vmContext = jsdomInstance.getInternalVMContext();
                    return compileFunction(code, parameters, {
                        parsingContext: vmContext,
                    });
                },
            } }, }, }, }, };
            // Scripts
            const deferedScripts = new Map;
            const mo = new window.MutationObserver( records => {
                for ( const record of records ) {
                    for ( const node of record.addedNodes ) {
                        if ( node.tagName !== 'SCRIPT' || node.src || (
                            !node.hasAttribute( 'scoped' ) && !node.hasAttribute( 'contract' )
                        ) ) continue;
                        const _clone = window.document.createElement( 'script' );
                        if ( node.hasAttribute( 'type' ) ) _clone.setAttribute( 'type', node.getAttribute( 'type' ) );
                        _clone.toggleAttribute( 'scoped', node.hasAttribute( 'scoped' ) );
                        _clone.toggleAttribute( 'contract', node.hasAttribute( 'contract' ) );
                        _clone.textContent = node.textContent;
                        deferedScripts.set( node, _clone );
                        node.textContent = '';
                    }
                }
            } );
            mo.observe( window.document, { childList: true, subtree: true } );
            window.document.addEventListener( 'load', () => {
                mo.disconnect();
                const vmContext = jsdomInstance.getInternalVMContext();
                for ( const [ node, _clone ] of deferedScripts ) {
                    node.replaceWith( _clone );
                    // Type: module don't run in jsdom
                    if ( _clone.getAttribute( 'type' )?.trim() === 'module' ) {
                        runInContext( _clone.textContent, vmContext );
                    }
                }
                deferedScripts.clear();
            } );
            // -------------
            // Add the window.print method
            // -------------
            window.print = () => jsdomInstance.serialize();
            window.toString = () => jsdomInstance.serialize();
            window.document.toString = () => jsdomInstance.serialize();
        },
    });
    return jsdomInstance.window;
}

/**
 * @exports
 */
export { Jsdom }