import { glob } from 'glob';
import { resolveApp, resolveCreateBuild } from './utils.js';
import path from 'path';
import { writeFile } from 'fs/promises';

const APP_DIR_NAME = 'app';

/** Use glob to find all `page.jsx` files in the `app` directory */
const filesPath = await glob(resolveApp('**/page.jsx'));

const routes = [...filesPath].map((filePath) => {
	const parentDirName = path.basename(path.dirname(filePath));
	return parentDirName === APP_DIR_NAME ? `/` : parentDirName;
});

for (const route of routes) {
	const code = `
        import { createRoot } from 'react-dom/client';
        import { createFromFetch } from 'react-server-dom-webpack/client';

        // HACK: map webpack resolution to native ESM
        // @ts-expect-error Property '__webpack_require__' does not exist on type 'Window & typeof globalThis'.
        window.__webpack_require__ = async (id) => {
            return import(id);
        };

        // @ts-expect-error \`root\` might be null
        const root = createRoot(document.getElementById('root'));

        // Construct the fetch URL for the server component stream
        const fetchUrl = \`/rsc/${route}\`;

        /**
         * Fetch your server component stream from \`/rsc/[route]\`
         * and render results into the root element as they come in.
         */
        createFromFetch(fetch(fetchUrl)).then((comp) => {
            root.render(comp);
        });
    `;

	const destination = path.join(resolveCreateBuild(route), '_client.jsx');

	await writeFile(destination, code);
}
