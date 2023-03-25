
/**
 * @imports
 */
import Fs from 'fs';
import Url from 'url';
import Path from 'path';
import Jsdom from 'jsdom';
import { runInContext } from 'vm';
import SelectiveResourceLoader from './SelectiveResourceLoader.js';

/**
 * Creates a DOM instance.
 * 
 * @param string source
 * @param object params
 * 
 * @return Jsdom.JSDOM
 */
export function createWindow( source, params = {} ) {
    const domIsMarkup = source.trim().startsWith( '<' );
    if ( !domIsMarkup && source && !Fs.existsSync( source ) ) {
        throw new Error( `The document filename "${ source }" does not exist.` );
    }
    if ( !params.url ) { throw new Error( `Document URL must be given in params.url.` ); }
    // -----------
    // Window setup
    // -----------
    const baseUrl = Url.parse( params.url );
    const resources = new SelectiveResourceLoader( {
        strictSSL: false,
        userAgent: params.userAgent || '@webqit/oohtml-ssr',
    } );
    const virtualConsole = new Jsdom.VirtualConsole();
    // Notice "omitJSDOMErrors: true"...
    // subresource-loading, fetch() and page errors are handled at SelectiveResourceLoader, window.fetch patch, and window.onerror respectively
    virtualConsole.sendTo( console, { omitJSDOMErrors: true } );
    const jsdomInstance = new Jsdom.JSDOM(domIsMarkup ? source : ( source ? Fs.readFileSync( source ).toString() : '' ), {
        url: params.url,
        pretendToBeVisual: params.pretendToBeVisual,
        resources,
        virtualConsole,
        runScripts: 'dangerously',
        beforeParse( window ) {
            // -------------
            // Document error handling
            // Since 'jsdomError' events are disabled in virtualConsole.sendTo()
            // -------------
            window.addEventListener( 'error', e => {
                console.error( e.error );
            } );
            // -------------
            // Prox relative URLs
            // -------------
            window.fetch = async ( url, options ) => {
                if ( options.element ) {
                    return resources.fetch( url, options ).then( data => ( {
                        ok: true, text: () => Promise.resolve( data ? data + '' : '' ),
                    } ) );
                }
                url = url.trim();
                if ( !url.includes( ':' ) || ![ 'file', 'http', 'https', ].includes( url.split( ':' )[ 0 ] ) ) {
                    if ( baseUrl.href.startsWith( 'file:/' ) ) {
                        url = `${ baseUrl.href }/${ url }`;
                    } else if ( url.startsWith( '//' ) ) {
                        url = `${ baseUrl.protocol }${ url }`;
                    } else if ( url.startsWith( '/' ) ) {
                        url = `${ baseUrl.protocol }//${ baseUrl.host }${ url }`;
                    } else {
                        url = `${ baseUrl.protocol }//${ baseUrl.host }${ Path.join( baseUrl.path, url ).replace( /\\/g, '/' ) }`;
                    }
                }
                return fetch( url, options ).catch( e => {
                    console.log( `[OOHTMLSSR]: Error fetching resource ${ url }` );
                    console.log( e.message );
                } );
            };
            // -------------
            // Scoped JS?
            // -------------
            window.MessageChannel = MessageChannel;
            window.webqit = window.webqit || {};
            window.webqit.SubscriptCompilerWorker = {
                postMessage( data, transfers ) {
                    if ( !window.webqit.SubscriptCompilerImport ) {
                        const scriptImportSource = `
                        const customUrl = window.document.querySelector( 'meta[name="subscript-compiler-url"]' );
                        const compilerUrls = ( customUrl?.content.split( ',' ) || [] ).concat( 'https://unpkg.com/@webqit/subscript/dist/compiler.js' );
                        window.webqit.SubscriptCompilerImport = new Promise( res => {
                            ( function importScript() {
                                const script = window.document.createElement( 'script' );
                                script.setAttribute( 'src', compilerUrls.shift().trim() );
                                script.toggleAttribute( 'ssr' );
                                window.document.head.append( script );
                                script.addEventListener( 'load', () => { res(); script.remove(); } );
                                if ( compilerUrls.length ) { script.addEventListener( 'error', () => { importScript(); script.remove(); } ); }
                            } )();
                        } );`;
                        runInContext( scriptImportSource, jsdomInstance.getInternalVMContext() );
                    }
                    window.webqit.SubscriptCompilerImport.then( () => {
                        const { parse, compile } = window.webqit.SubscriptCompiler;
                        const { source, params } = data;
                        const ast = parse( source, params.parserParams );
                        const compilation = compile( ast, params.compilerParams );
                        compilation.identifier = compilation.identifier.toString();
                        transfers[ 0 ]?.postMessage( compilation );
                    } );
                }
            };
            // Scripts
            const scriptClones = new Map;
            const mo = new window.MutationObserver( records => {
                for ( const record of records ) {
                    for ( const node of record.addedNodes ) {
                        if ( node.tagName !== 'SCRIPT' || node.src || (
                            !node.hasAttribute( 'scoped' ) && !node.hasAttribute( 'contract' )
                        ) || window.webqit.oohtml?.Script ) continue;
                        let textContent = node.textContent;
                        node.textContent = ''; // Disarm the script
                        const _clone = window.document.createElement( 'script' );
                        if ( node.hasAttribute( 'type' ) ) _clone.setAttribute( 'type', node.getAttribute( 'type' ) );
                        _clone.toggleAttribute( 'scoped', node.hasAttribute( 'scoped' ) );
                        _clone.toggleAttribute( 'contract', node.hasAttribute( 'contract' ) );
                        _clone.textContent = textContent;
                        scriptClones.set( node, _clone );
                    }
                }
            } );
            mo.observe( window.document, { childList: true, subtree: true } );
            window.document.addEventListener( 'load', () => {
                mo.disconnect();
                for ( const [ node, _clone ] of scriptClones ) {
                    node.replaceWith( _clone );
                }
            } );
            // -------------
            // Add the window.print method
            // -------------
            window.print = () => jsdomInstance.serialize();
            window.toString = () => jsdomInstance.serialize();
            window.document.toString = () => jsdomInstance.serialize();

            if ( params.beforeParse ) { params.beforeParse( window ); }
        },
    } );
    return jsdomInstance.window;
}

/**
 * @exports
 */
export { Jsdom }