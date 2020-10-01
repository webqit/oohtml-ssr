
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import Jsdom from 'jsdom';
import nodeFetch from 'node-fetch';
import Chtml from '@web-native-js/chtml';
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
        throw new Error('The document filename given in query parameter "?document=' + source + '" does not exist.');
    }
    
    // -----------
    // Window setup
    // -----------
    const jsdomInstance = new Jsdom.JSDOM(domIsMarkup ? source : (source ? Fs.readFileSync(source).toString() : ''), {
        contentType: 'text/html',
        pretendToBeVisual: params.visual !== false,
        beforeParse(window) {
            // Polyfill the window.fetch API
            window.fetch = (url, options) => {
                url = url.trim();
                // Prox relative URLs
                if (url.startsWith('//')) {
                    url = 'http:' + url;
                } else if (!url.startsWith('http')) {
                    url = Path.join(params.host, url);
                }
                if (params.logging) {
                    console.log('[FETCH]: ' + url);
                }
                return nodeFetch(url, options);
            };
            // Add the window.print method
            window.print = () => jsdomInstance.serialize();
            // The CHTML polyfill
            new Chtml(window);
        }/*,
        resources: new Jsdom.ResourceLoader({
            proxy: params.host, //"http://127.0.0.1:9001",
            strictSSL: false,
            userAgent: params.ua, //"Mellblomenator/9000",
        })*/,
    });
    
    return jsdomInstance.window;
};

/**
 * @exports
 */
export {
    Jsdom,
};