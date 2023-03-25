
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
    fetch( url, options ) {
        if ( !options.element.hasAttribute( 'ssr' ) || !options.element.hasAttribute( 'src' ) ) return;
        const src = options.element.getAttribute( 'src' );
        if ( !src.includes( ':' ) || ![ 'file', 'http', 'https', ].includes( src.split( ':' )[ 0 ] ) ) {
            const baseUrl = options.element.ownerDocument.location;
            if ( baseUrl.href.startsWith( 'file:/' ) ) {
                // Notice we are not relying on document-resolved url here.
                // E.g. if document.URL is "file:///C:/path" and element src is "/file", document-resolved url will be "file:///C:/file"
                // Notice we do not want to use the Path utility here. Destroys the file:/// url convention
                url = `${ baseUrl.href }/${ src }`;
            }
        }
        return super.fetch( url, options );
    }
};