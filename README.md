# OOHTML Server-Side Rendering

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/oohtml-ssr" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/oohtml-ssr.svg" alt="NPM version" /></a></span><span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/oohtml-ssr" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/oohtml-ssr.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

OOHTML SSR is a server-side DOM implementation with native support for OOHTML. It makes it straight-forward to render OOHTML-based documents right on the server.

This library is currently based on [jsdom](https://github.com/jsdom/jsdom) for a full DOM implementation, but hopes to explore a *less-complete* DOM alternative to provide better performance. So, this isn't quite ready for production yet!

## Installation

With [npm available on your terminal](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), run the following command to install OOHTML SSR.

> System Requirements: Node.js 14.0 or later.

```js
npm i @webqit/oohtml-ssr
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

### Options

+ **`url`: `String`** - (Required) The URL that translates to `widnow.location`.
+ **`user_agent`: `String`** - The User Agent string used to fetch sub resources. (Defaults to: `@webqit/oohtml-ssr`.)
+ **`oohtml_level`: `String`** - How much of OOHTML to support.
    + **`full`** - (Full OOHTML support; default) [HTML Modules](https://github.com/webqit/oohtml#html-modules), [HTML Imports](https://github.com/webqit/oohtml#html-imports), [Namespaced HTML](https://github.com/webqit/oohtml#namespaced-html), [The State API](https://github.com/webqit/oohtml#the-state-api), [Subscript](https://github.com/webqit/oohtml#subscript).
    + **`namespacing`** - [Namespaced HTML](https://github.com/webqit/oohtml#namespaced-html).
    + **`scripting`** - [The State API](https://github.com/webqit/oohtml#the-state-api), [Subscript](https://github.com/webqit/oohtml#subscript).
    + **`templating`** - [HTML Modules](https://github.com/webqit/oohtml#html-modules), [HTML Imports](https://github.com/webqit/oohtml#html-imports).
    + **`none`** - (None of OOHTML)

### Import-Based Instantiation

It is possible to directly obtain a DOM instance with an `import` expression. Simply import from the `@webqit/oohtml-ssr/instance.js` module with your HTML file name, and other relevant instance parameters, serialized in the import URL.

```js
import { window, document } from '@webqit/oohtml-ssr/instance.js?file=index.html&url=http://localhost';
```

```js
const { window, document } = await import('@webqit/oohtml-ssr/instance.js?file=index.html&url=http://localhost');
```

> Import-based instantiation may be useful when you want to take advantage of the import cache to keep instances cached per URL.

### DOM Readiness

It is often necessary to know at what point the document has been fully loaded and ready to be traversed. Much of OOHTML waits until this happens. You'd normally want to test the [`document.readyState`](https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState) property and/or listen for the [`readystatechange`](https://developer.mozilla.org/en-US/docs/Web/API/Document/readystatechange_event) event on the `document` object. OOHTML exposes a quick way:

```js
window.WebQit.DOM.ready(() => {
    // console.log( 'DOM is ready!' );
    const html = window.toString();
});
```

```js
await new Promise(res => window.WebQit.DOM.ready(res));
// console.log( 'DOM is ready!' );
const html = window.toString();
```

Where the document contains OOHTML Modules with remote contents - `<template name="pages" src="/bundle.html"></template>`, observing the *readiness* of those modules might also be necessary. (Certain HTML Import elements - `<import template="pages"></import>` may be waiting for this to happen.) You'd typically want to test the `document.templatesReadyState` property and/or listen for the `templatesreadystatechange` event on the `document` object:

```js
window.WebQit.DOM.ready(() => {
    // console.log( 'DOM is ready!' );
    const html = window.toString();
});
```

```js
await new Promise(res => {
    window.document.templatesReadyState === 'complete' && res(), window.document.addEventListener('templatesreadystatechange', res);
});
// console.log( 'DOM is ready; Templates have loaded!' );
const html = window.toString();
```

Also, in some cases, certain *async* operations within scripts in the loaded document may need to be awaited before serializing the document. But you should test with your usecase to know if this is necessary.

```js
await new Promise(res => setTimeout(res, 10));
const html = window.toString();
```

### Subresource Loading

By default, subresources (`<script src>`, etc) embedded on the HTML document are not fetched! But the Boolean attribute `ssr` can be added to a resource to get it fetched.

```js
/**
 ├── script.js
 */
let h1Element = document.createElement('h1');
h1Element.innerHTML = 'Hello World!';
document.body.appendChild(h1Element);
```

```html
<!DOCTYPE html>
<html>
    <head>
        <script ssr defer src="/script.js"></script>
    </head>
    <body>
    </body>
<html>
```

## Getting Involved

All forms of contributions and PR are welcome! To report bugs or request features, please submit an [issue](https://github.com/webqit/oohtml-ssr/issues). For general discussions, ideation or community help, please join our github [Discussions](https://github.com/webqit/oohtml-ssr/discussions).

## License

MIT.
