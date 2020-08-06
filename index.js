
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import Jsdom from 'jsdom';
import ResourceLoader from './ResourceLoader.js';

/**
 * Creates a DOM instance.
 * 
 * @param object params
 *      document,
 *      pretend-to-be-visual,
 *      resources,
 *      show-fetch-log,
 *      localhost,
 *      user-agent,
 * 
 * @return Jsdom.JSDOM
 */
export function create(params) {

    if (params.document && !Fs.existsSync(params.document)) {
        throw new Error('The document filename given in query parameter "?document=' + params.document + '" does not exist.');
    }
    if (params.resources && !Fs.existsSync(params.resources)) {
        throw new Error('The resources DIR given in query parameter "?resources=' + params.resources + '" does not exist.');
    }
    
    // -----------
    // Window setup
    // -----------
    const jsdomInstance = new Jsdom.JSDOM(params.document ? Fs.readFileSync(params.document).toString() : '', {
        contentType: 'text/html',
        pretendToBeVisual: parseInt(params['pretend-to-be-visual']) === 1,
    });
    // Polyfill the window.fetch API
    jsdomInstance.window.fetch = (url, options) => new Promise((resolve, reject) => {
        var resourceLoader, resourcePromise;
        try {
            resourceLoader = new ResourceLoader({
                resourcesDir: params.resources || (params.document ? Path.dirname(params.document) : ''),
                localhost: params.localhost,
                'user-agent': params['user-agent'],
                showFetchLog: parseInt(params['show-fetch-log']) === 1,
            });
        } catch(e) {
            return Promise.reject(e);
        }
        resourcePromise = resourceLoader.fetch(url, options);
        resolve({
            ok: true,
            text: () => resourcePromise,
            json: () => resourcePromise.then(data => JSON.parse(data)),
        });
    });
    
    return jsdomInstance;
};

/**
 * @exports
 */
export {
    Jsdom,
    ResourceLoader,
};