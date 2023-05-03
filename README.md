# OOHTML Server-Side Rendering

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/oohtml-ssr" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/oohtml-ssr.svg" alt="NPM version" /></a></span><span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/oohtml-ssr" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/oohtml-ssr.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

OOHTML SSR is a server-side DOM implementation with native support for [OOHTML](https://github.com/webqit/oohtml). It makes it straight-forward to render OOHTML-based documents right on the server. This library is based on [jsdom](https://github.com/jsdom/jsdom)!

> **Note**
> <br>This is documentation for `OOHTML-SSR@1.2.x` - for working with [`OOHTML@2.x`](https://github.com/webqit/oohtml/tree/next). (Looking for [`OOHTML-SSR@1.1.x`](https://github.com/webqit/oohtml-ssr/tree/v1.1.5)?)

## Installation

With [npm available on your terminal](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), run the following command to install OOHTML SSR.

> System Requirements: Node.js 14.0 or later.

```js
npm i @webqit/oohtml-ssr@next
```

## Usage

Import and call the `createWindow` function with an HTML *document* and a `params` object. *Document* can be either an HTML markup string or file name.

```js
import ( createWindow ) from `@webqit/oohtml-ssr`;

// The params.url is required
const params = { url: 'http://localhost' };
const window = createWindow( `./index.html`, params );

// Get serialized document
const html = window.toString(); // Alternatively: '<!DOCTYPE html>' + window.document.documentElement.outerHTML
```

> File name is relative to the Current Working Directory but can be an absolute url.

The OOHTML polyfill is loaded at the document level:

```html
<!DOCTYPE html>
<html>
    <head>
        <script ssr src="https://unpkg.com/@webqit/oohtml@latest/dist/main.js"></script>
    </head>
    <body>
    </body>
<html>
```

### Options

+ **`url`: `String`** - (Required) The URL that translates to `widnow.location`.
+ **`userAgent`: `String`** - The User Agent string used to fetch sub resources. (Defaults to: `@webqit/oohtml-ssr`.)
+ **`beforeParse`: `Function`** - An optional function to call before page parsing begins. This function receives the created `window` object.

### Import-Based Instantiation

It is possible to directly obtain a DOM instance with an `import` expression. Simply import from the `@webqit/oohtml-ssr/instance.js` module with your HTML file name, and other relevant instance parameters, serialized in the import URL.

```js
import { window, document } from '@webqit/oohtml-ssr/instance.js?file=index.html&url=http://localhost';
```

```js
const { window, document } = await import( '@webqit/oohtml-ssr/instance.js?file=index.html&url=http://localhost' );
```

> Import-based instantiation may be useful when you want to take advantage of the import cache to keep instances cached per URL.

### DOM Readiness

It is often necessary to know at what point the document has been fully loaded and ready to be traversed. Much of OOHTML waits until this happens. You'd normally want to listen for the [`window.onload`](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event) event.

```js
await new Promise( res => window.addEventListener( 'load', res ) );
// console.log( 'DOM is ready!' );
const html = window.toString();
```

Also, in some cases, certain *async* operations within scripts in the loaded document may need to be awaited before serializing the document. But you should test with your usecase to know if this is necessary.

```js
await new Promise( res => setTimeout( res, 10 ) );
const html = window.toString();
```

### Subresource Loading

By default, subresources (`<script src>`, etc) embedded on the HTML document are not fetched! But the Boolean attribute `ssr` can be added to a resource to get it fetched.

```html
<!DOCTYPE html>
<html>
    <head>
        <script ssr src="/script.js"></script>
        <template ssr src="/bundle.html"></template>
    </head>
    <body>
    </body>
<html>
```

Note that relative URLs are resolved against the value of `window.location`/`document.URL` which is controlled by the [`options.url`](#options) parameter. For example, given `options.url = "hhtp://localhost/path"`, the relative URL `/script.js` will evaluate to `hhtp://localhost/script.js`. But this goes a bit differently when `window.location` is a `file:` URL; relative URLs are resolved against the full *path*, not the *origin*. So, given `options.url = "file:///C:base/path"`, the relative URL `/script.js` will resolve to `file:///C:base/path/script.js`. (And it's successfully loaded from the filesystem where exists.)

## Getting Involved

All forms of contributions and PR are welcome! To report bugs or request features, please submit an [issue](https://github.com/webqit/oohtml-ssr/issues). For general discussions, ideation or community help, please join our github [Discussions](https://github.com/webqit/oohtml-ssr/discussions).

## License

MIT.
