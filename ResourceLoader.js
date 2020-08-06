
/**
 * @imports
 */
import Fs from 'fs';
import Url from 'url';
import Path from 'path';
import Jsdom from 'jsdom';
import Chalk from 'chalk';

/**
 * --------------
 * Subclasses the Jsdom.ResourceLoader class
 * to customly fetch resources
 * --------------
 */
export default class ResourceLoader extends Jsdom.ResourceLoader {

    constructor(params = {}) {
        super(params);
        this._params = params;
    }

    fetch(url, options) {
        if (this._params.resourcesDir) {
            var _url = Url.parse(url);
            //const { parseURL } = require("whatwg-url");
            //const url = parseURL(urlString);
            //url.scheme: data, http, https, file
            if ((!_url.host || _url.host === this._params.localhost)) {
                if (this._params.showFetchLog) {
                    console.log(Chalk.yellow('[FETCH]: Local resource fetching:'), url);
                }
                return new Promise((resolve, reject) => {
                    Fs.readFile(Path.join(this._params.resourcesDir, _url.pathname), function(err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data.toString());
                        }
                    });
                });
            }
            if (this._params.showFetchLog) {
                console.log(Chalk.yellow('[FETCH]: Default resource fetching:'), url);
            }
        }
        return super.fetch(url, options);
    }
};