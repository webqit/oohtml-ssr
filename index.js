
/**
 * @imports
 */
import Fs from 'fs';
import Url from 'url';
import Path from 'path';
import Jsdom from 'jsdom';
import nodeFetch from 'node-fetch';
import Oohtml from '@webqit/oohtml';
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
    if (!params.URL) {
        throw new Error('Document URL must be given in params.URL.');
    }
    
    // -----------
    // Window setup
    // -----------
    const URL = Url.parse(params.URL);
    const jsdomInstance = new Jsdom.JSDOM(domIsMarkup ? source : (source ? Fs.readFileSync(source).toString() : ''), {
        url: params.URL,
        contentType: 'text/html',
        pretendToBeVisual: params.VISUAL_PSEUDO_MODE !== false,
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
                if (params.LOG_FETCH) {
                    console.log('[FETCH]: ' + url);
                }
                return nodeFetch(url, options);
            };
            // Add the window.print method
            window.print = () => jsdomInstance.serialize();
            window.toString = () => window.print();
        },
        resources: new SelectiveResourceLoader({
            strictSSL: false,
            userAgent: params.USER_AGENT || 'WEBQIT/webflo',
        }),
        runScripts: 'dangerously',
    });

    // The CHTML polyfill
    const vmContext = jsdomInstance.getInternalVMContext();
    Oohtml.call(jsdomInstance.window, { Subscript: { runtimeParams: {
        compileFunction: (code, parameters) => compileFunction(code, parameters, {
            parsingContext: vmContext,
        }),
    } } } );
    
    return jsdomInstance.window;
}

/**
 * @exports
 */
export {
    Jsdom,
}