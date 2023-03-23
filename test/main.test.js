
/**
 * @imports
 */
import { expect } from 'chai';
import { createWindow } from '../src/index.js';
const documentReady = window => new Promise( res => {
    window.document.addEventListener( 'readystatechange', () => window.document.readyState === 'complete' && res() );
} );

describe( `MAIN...`, function() {
    this.timeout( 10000 );

    it ( `Basic... [TODO]`, async function() {
        const { window, document } = createWindow(`
        <!doctype html>
        <html>
            <head>
                <script ssr src="http://127.0.0.1:5500/oohtml/dist/main.js"></script>
            </head>
            <body>
                <script type="module" scoped contract>
                    console.log('-----------tagName:', this.tagName);
                </script>
            </body>
        </html>
        `, { url: 'http://localhost' } );

        await documentReady( window );
        expect( window.webqit ).to.have.property('oohtml');
    } );

} );