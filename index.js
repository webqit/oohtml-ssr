
/**
 * @imports
 */
import Fs from 'fs';
import Url from 'url';
import Path from 'path';
import Jsdom from 'jsdom';
import nodeFetch from 'node-fetch';
import Oohtml from '@webqit/oohtml';
import NamespaceHTML from '@webqit/oohtml/src/namespaced-html/index.js';
import HTMLModules from '@webqit/oohtml/src/html-modules/index.js';
import HTMLImports from '@webqit/oohtml/src/html-imports/index.js';
import StateAPI from '@webqit/oohtml/src/state-api/index.js';
import Subscript from '@webqit/oohtml/src/subscript/index.js';
import { compileFunction } from 'vm';
import SelectiveResourceLoader from './SelectiveResourceLoader.js';

/**
 * Creates a DOM instance.
 * 
 * @param object params
 *      visual,
 *      logging,
 *      host,
 *      ua,
 * 
 * @return Jsdom.JSDOM
 */
export function createWindow(source, params) {

    var domIsMarkup = source.trim().startsWith('<');
    if (!domIsMarkup && source && !Fs.existsSync(source)) {
        throw new Error('The document filename "' + source + '" does not exist.');
    }
    if (!params.url) {
        throw new Error('Document URL must be given in params.url.');
    }
    
    // -----------
    // Window setup
    // -----------
    const URL = Url.parse(params.url);
    const jsdomInstance = new Jsdom.JSDOM(domIsMarkup ? source : (source ? Fs.readFileSync(source).toString() : ''), {
        url: params.url,
        contentType: 'text/html',
        pretendToBeVisual: params.pseudovisual_mode !== false,
        beforeParse(window) {
            // Polyfill the window.fetch API
            window.fetch = (url, options) => {
                url = url.trim();
                // Prox relative URLs
                if (url.startsWith('//')) {
                    url = URL.protocol + url;
                } else if (!url.startsWith('http')) {
                    if (url.startsWith('/')) {
                        url = URL.protocol + '//' + URL.host + url;
                    } else {
                        url = URL.protocol + '//' + URL.host + Path.join(URL.path.toLowerCase(), url).replace(/\\/g, '/');
                    }
                }
                if (params.log_fetch) {
                    console.log('[FETCH]: ' + url);
                }
                return nodeFetch(url, options);
            };
            // Add the window.print method
            window.print = () => jsdomInstance.serialize();
            window.toString = () => jsdomInstance.serialize();
            window.document.toString = () => jsdomInstance.serialize();
        },
        resources: new SelectiveResourceLoader({
            strictSSL: false,
            userAgent: params.user_agent || '@webqit/oohtml-ssr',
        }),
        runScripts: 'dangerously',
    });

    // The CHTML polyfill
    const vmContext = jsdomInstance.getInternalVMContext();
    const subscriptParams = { runtimeParams: {
        compileFunction: (code, parameters) => compileFunction(code, parameters, {
            parsingContext: vmContext,
        }),
    } };
    if (params.oohtml_level === 'namespacing') {
        NamespaceHTML.call(jsdomInstance.window);
    } else if (params.oohtml_level === 'scripting') {
        StateAPI.call(jsdomInstance.window);
        Subscript.call(jsdomInstance.window, subscriptParams);
    } else if (params.oohtml_level === 'templating') {
        HTMLModules.call(jsdomInstance.window);
        HTMLImports.call(jsdomInstance.window);
    } else if (params.oohtml_level !== 'none') {
        Oohtml.call(jsdomInstance.window, { Subscript: subscriptParams } );
    }
    
    return jsdomInstance.window;
}

/**
 * @exports
 */
export {
    Jsdom,
}