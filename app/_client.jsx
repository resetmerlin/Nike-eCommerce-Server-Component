import { createRoot } from 'react-dom/client';
import { createFromFetch } from 'react-server-dom-webpack/client';

// HACK: map webpack resolution to native ESM
// @ts-expect-error Property '__webpack_require__' does not exist on type 'Window & typeof globalThis'.
window.__webpack_require__ = async (id) => {
	return import(id);
};

// @ts-expect-error `root` might be null
const root = createRoot(document.getElementById('root'));

// Get the current pathname to request the appropriate server component
const pathname = window.location.pathname;

// Construct the fetch URL for the server component stream
const fetchUrl = `/rsc${pathname}`;

/**
 * Fetch your server component stream from `/rsc/[route]`
 * and render results into the root element as they come in.
 */
createFromFetch(fetch(fetchUrl)).then((comp) => {
	root.render(comp);
});
