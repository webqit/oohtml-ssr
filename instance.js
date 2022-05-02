
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
const window = createWindow(params.SOURCE, params);
const document = window.document;

if (parseInt(params.G) === 1) {
    globalThis.window = window;
    globalThis.document = document;
}

export {
    document,
    window,
};