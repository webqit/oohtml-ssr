
/**
 * @imports
 */
import { expect } from 'chai';
import { createWindow } from '../src/index.js';
const documentReady = window => new Promise( res => {
    window.document.addEventListener( 'readystatechange', () => window.document.readyState === 'complete' && res() );
} );
const delay = dur => new Promise( res => setTimeout( res, dur ) );

describe( `MAIN...`, function() {
    this.timeout( 10000 );

    it ( `Basic... [TODO]`, async function() {
        const { window, document } = createWindow(`
        <!doctype html>
        <html>
            <head>
                <script ssr src="https://unpkg.com/@webqit/oohtml@next/dist/main.js"></script>
                <script>
                const script = document.createElement( 'script' );
                script.setAttribute( 'type', 'module' );
                script.toggleAttribute( 'scoped' );
                script.textContent = 'console.log( "this2", this.tagName ); this.testProp2 = "Works!"';
                setTimeout(() => {
                    document.body.append( script );
                }, 200);
                </script>
            </head>
            <body>
                <script scoped contract>
                    console.log( "this1", this.tagName );
                    this.testProp = 'Works!';
                </script>
            </body>
        </html>
        `, { url: 'http://localhost' } );

        await documentReady( window );
        //expect( document.body.testProp ).to.eq('Works!');
        await delay( 200 );
        expect( document.body.testProp2 ).to.eq('Works!');
        //console.log('::::::::::::::::::::::::::::::', document.body.outerHTML);
    } );

} );