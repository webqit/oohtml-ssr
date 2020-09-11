
/**
 * @imports
 */
import Url from 'url';
import QueryString from 'querystring';
import { createWindow } from './index.js';

// -----------
// Obtain parameters passed here 
// via the import URL
// -----------
const importURL = Url.parse(import.meta.url);
const params = QueryString.parse(importURL.query);
const jsdomInstance = createWindow(params);
var document = jsdomInstance.window.document,
    window = jsdomInstance.window;

if (parseInt(params.g) === 1) {
    global.window = window;
    global.document = document;
}

export {
    document,
    window,
    jsdomInstance,
};