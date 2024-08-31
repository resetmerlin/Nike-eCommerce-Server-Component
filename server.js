import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { build as esbuild } from 'esbuild';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { copyFile, readFile, unlink, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import path, { relative } from 'node:path';
import { sassPlugin } from 'esbuild-sass-plugin';
import {
	getPages,
	resolveApp,
	resolveBuild,
	resolveCreateBuild,
	updateImportPath
} from './utils.js';

const app = new Hono();
const CLIENT_COMPONENT_MAP = {};
const clientEntryPoints = new Map();
const ROOT_DIRECTORY = process.cwd();
const REACT_COMPONENT_REGEX = /\.jsx$/;

// Function to dynamically create routes based on the directories
async function createRoutes() {
	const directories = await getPages(resolveApp(''));

	for (let dir of directories) {
		app.get(`/${dir}`, async (c) => {
			return c.html(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>${dir} - My Website</title>
					<link rel="stylesheet" href="/build/${dir}/page.css">
				</head>
				<body>
					<div id="root"></div>
<script type="module" src="/build/${dir}/_client.js"></script>				</body>
				</html>
			`);
		});

		// Endpoint to render the server component to a stream
		app.get(`/rsc/${dir}`, async (c) => {
			const Page = await import(`./build/${dir}/page.js`);
			const Comp = createElement(Page.default);

			const stream = ReactServerDom.renderToReadableStream(Comp, CLIENT_COMPONENT_MAP);
			return new Response(stream);
		});
	}
}

// Serve static assets from 'build' and 'public' directories
app.use('/build/*', serveStatic());
app.use('/*', serveStatic({ root: './public' }));

// Initialize and start the server
async function startServer() {
	await buildRSC();
	await buildClient();
	await createRoutes();

	serve(
		{
			fetch: app.fetch,
			port: 1580
		},
		(info) => {
			console.log(`Listening on http://localhost:${info.port}`);
		}
	);
}

startServer().catch((err) => {
	console.error('Failed to start the server:', err);
});

/**
 *
 * 	@todo Need to care about edge case like app/page.jsx instead of app/randomFolder/page.jsx
 *  @description Build Server Components and Add lists of client components
 *
 * */
async function buildRSC() {
	/**
	 * Get all the folder that inside of app directory
	 */
	const directories = await getPages(resolveApp(''));

	for (let dir of directories) {
		// Build server components
		await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints: [resolveApp(`${dir}/page.jsx`)], // app/yourFolder/page.jsx
			outdir: resolveBuild(dir), // build/yourFoldr insstead of build/app/yourFolder
			packages: 'external',
			plugins: [
				{
					name: 'resolve-client-imports',
					setup(build) {
						build.onResolve(
							{ filter: REACT_COMPONENT_REGEX },
							async ({ path: relativePath, importer }) => {
								if (relativePath.endsWith('.scss')) {
									return { external: true }; // Skip processing .scss files
								}

								/**
								 * if the path starts with relative path, change it into absolute path
								 * @example
								 * ../../components/Product/index.jsx
								 * // into
								 * yourRootDir/components/Product/index.jsx
								 */
								const absolutePath = relativePath.startsWith('.')
									? path.resolve(path.dirname(importer), relativePath)
									: resolveApp(relativePath);

								const contents = await readFile(absolutePath, 'utf-8');

								/**
								 * Get relative entry points based on the root directory and absolute directory
								 * @example
								 * yourRootDir/components/Product/index.jsx
								 * // into
								 * components/Product/index.jsx
								 *
								 */
								const entryDirLists = path.relative(ROOT_DIRECTORY, absolutePath);

								// Needs to bundle client component and server component separately. so add client components path to build later

								if (!contents.startsWith("'use client'")) {
									return; // check it is not client component or not
								}

								if (!clientEntryPoints.has(dir)) {
									// If the key does not exist, initialize it with an empty array
									clientEntryPoints.set(dir, []);
								}
								// Push the new value to the existing array
								clientEntryPoints.get(dir).push(absolutePath);

								// check is client component is outside of server component, ex: components/Product/index.jsx
								return {
									external: true,
									// change import path into build components path ex: /home/resetmerlin/UbuntuCodeRepo/Nike-eCommerce-Server-Component/build/components/Product/index.js
									path: resolveBuild(entryDirLists).replace(REACT_COMPONENT_REGEX, '.js')
								};
							}
						);
					}
				},
				sassPlugin()
			],
			loader: {
				'.png': 'file'
			}
		});
	}
}

/** Build client components */
async function buildClient() {
	const directories = await getPages(resolveApp(''));

	for (const dir of directories) {
		const bundleDir = `${dir}/_client.jsx`;

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
			const fetchUrl = \`/rsc/${dir}\`;

			/**
			 * Fetch your server component stream from \`/rsc/[route]\`
			 * and render results into the root element as they come in.
			 */
			createFromFetch(fetch(fetchUrl)).then((comp) => {
				root.render(comp);
			});
		`;

		const destination = resolveBuild(bundleDir);

		await writeFile(destination, code);

		if (!clientEntryPoints.has(dir)) {
			clientEntryPoints.set(dir, []);
		}
		clientEntryPoints.get(dir).push(bundleDir);
	}
	for (const pageEntryPoint of clientEntryPoints.keys()) {
		const clientEntryLists = clientEntryPoints.get(pageEntryPoint).map(async (entry) => {
			/**
			 * @example
			 * components/Product/index.jsx -> [ 'components', 'Product', 'index.jsx' ]
			 */
			const splittedDirectoryLists = path.relative(ROOT_DIRECTORY, entry).split('/');

			/**
			 * @example
			 * [ 'components', 'Product', 'index.jsx' ] -> index.jsx
			 */
			const fileName = splittedDirectoryLists?.pop() ?? '';

			/**
			 * Creates directory components/Product/ inside build directory
			 * @example
			 * [ 'components', 'Product' ]  -> build/components/Product
			 *
			 */
			const directoryInsideBuildDir = resolveCreateBuild(splittedDirectoryLists.join('/'));

			/**
			 * Generate full path of file
			 * @example
			 * build/components/Product/index.jsx
			 */
			const fullPath = path.join(directoryInsideBuildDir, fileName);

			/** Copy file into desired directory */
			await copyFile(entry, fullPath);

			await updateImportPath(entry, fullPath);

			return fullPath;
		});

		const promisedClientEntryLists = await Promise.all(clientEntryLists);

		if (promisedClientEntryLists.length === 1) {
			console.log(promisedClientEntryLists);
			const { outputFiles } = await esbuild({
				bundle: true,
				format: 'esm',
				logLevel: 'error',
				entryPoints: [...promisedClientEntryLists],
				outdir: resolveBuild(pageEntryPoint),
				splitting: true,
				write: false,
				plugins: [
					sassPlugin() // Include the sassPlugin for client build
				],
				loader: {
					'.jsx': 'jsx', // Ensuring that .jsx files are handled correctly
					'.scss': 'css' // Ensuring that .scss files are handled correctly
				}
			});

			outputFiles.forEach(async (file) => {
				// Parse file export names
				const [, exports] = parse(file.text);
				let newContents = file.text;

				for (const exp of exports) {
					// Create a unique lookup key for each exported component.
					// Could be any identifier!
					// We'll choose the file path + export name for simplicity.
					const key = file.path + exp.n;

					CLIENT_COMPONENT_MAP[key] = {
						// Have the browser import your component from your server
						// at `/build/[component].js`
						id: `/build/${relative(resolveBuild(), file.path)}`,
						// Use the detected export name
						name: exp.n,
						// Turn off chunks. This is webpack-specific
						chunks: [],
						// Use an async import for the built resource in the browser
						async: true
					};

					// Tag each component export with a special `react.client.reference` type
					// and the map key to look up import information.
					// This tells your stream renderer to avoid rendering the
					// client component server-side. Instead, import the built component
					// client-side at `clientComponentMap[key].id`
					newContents += `
		${exp.ln}.$$id = ${JSON.stringify(key)};
		${exp.ln}.$$typeof = Symbol.for("react.client.reference");
					`;
				}
				await writeFile(file.path, newContents);
			});

			return;
		}

		const entryPoints = [...promisedClientEntryLists];

		const { outputFiles } = await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints,
			outdir: resolveBuild(),
			splitting: true,
			write: false,
			plugins: [
				sassPlugin() // Include the sassPlugin for client build
			],
			loader: {
				'.jsx': 'jsx', // Ensuring that .jsx files are handled correctly
				'.scss': 'css' // Ensuring that .scss files are handled correctly
			}
		});

		outputFiles.forEach(async (file) => {
			// Parse file export names
			const [, exports] = parse(file.text);
			let newContents = file.text;

			for (const exp of exports) {
				// Create a unique lookup key for each exported component.
				// Could be any identifier!
				// We'll choose the file path + export name for simplicity.
				const key = file.path + exp.n;

				CLIENT_COMPONENT_MAP[key] = {
					// Have the browser import your component from your server
					// at `/build/[component].js`
					id: `/build/${relative(resolveBuild(), file.path)}`,
					// Use the detected export name
					name: exp.n,
					// Turn off chunks. This is webpack-specific
					chunks: [],
					// Use an async import for the built resource in the browser
					async: true
				};

				// Tag each component export with a special `react.client.reference` type
				// and the map key to look up import information.
				// This tells your stream renderer to avoid rendering the
				// client component server-side. Instead, import the built component
				// client-side at `clientComponentMap[key].id`
				newContents += `
	${exp.ln}.$$id = ${JSON.stringify(key)};
	${exp.ln}.$$typeof = Symbol.for("react.client.reference");
				`;
			}
			await writeFile(file.path, newContents);
		});
	}
}
