
/**
 * @imports
 */
import Jsdom from 'jsdom';

/**
 * @SelectiveResourceLoader
 */
export default class SelectiveResourceLoader extends Jsdom.ResourceLoader {

    /**
     * Only load subresources marked as "ssr".
     * 
     * @param string url 
     * @param object options 
     * 
     * @return Promise|null
     */
    fetch(url, options) {
        if (options.element.hasAttribute('ssr')) {
            return super.fetch(url, options);
        }
        return null;
    }
};