
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
    async fetch( url, options ) {
        if ( !options.element.hasAttribute( 'ssr' ) || !options.element.hasAttribute( 'src' ) ) return;
        const baseUrl = options.element.ownerDocument.location;
        const src = options.element.getAttribute( 'src' );
        if ( baseUrl.href.startsWith( 'file:/' ) && ( !src.includes( ':' ) || ![ 'file', 'http', 'https', ].includes( src.split( ':' )[ 0 ] ) ) ) {
            // Notice we are not relying on document-resolved url here.
            // E.g. if baseUrl is "file:///C:/path" and element src is "/file.ext", document-resolved url will be "file:///C:/file.ext" but we want "file:///C:/path/file.ext"
            // Notice we do not want to use the Path utility here. Destroys the file:/// url convention in windows
            url = `${ baseUrl.href }/${ src }`;
        }
        return super.fetch( url, options ).catch( e => {
            console.log( `[OOHTMLSSR]: Error loading subresource ${ url }` );
            console.log( e.message );
        } );
    }
};