import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { build as esbuild } from 'esbuild';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import path, { relative } from 'node:path';
import { sassPlugin } from 'esbuild-sass-plugin';
import { getDirectories, resolveApp, resolveBuild, resolveCreateBuild } from './utils.js';
import fs from 'fs-extra';

const app = new Hono();
const CLIENT_COMPONENT_MAP = {};
const clientEntryPoints = new Map();
const ROOT_DIRECTORY = process.cwd();
const REACT_COMPONENT_REGEX = /\.jsx$/;

// Function to dynamically create routes based on the directories
async function createRoutes() {
	const directories = await getDirectories(resolveApp(''));

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
	await build();
	await createRoutes();

	serve(
		{
			fetch: app.fetch,
			port: 8981
		},
		(info) => {
			console.log(`Listening on http://localhost:${info.port}`);
		}
	);
}

startServer().catch((err) => {
	console.error('Failed to start the server:', err);
});

/** Build Server Components and Add lists of client components */
async function buildRSC() {
	const directories = await getDirectories(resolveApp(''));

	for (let dir of directories) {
		// Build server components
		await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints: [resolveApp(`${dir}/page.jsx`)],
			outdir: resolveBuild(dir),
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
									if (!clientEntryPoints.has(dir)) {
										// If the key does not exist, initialize it with an empty array
										clientEntryPoints.set(dir, []);
									}
									// Push the new value to the existing array
									clientEntryPoints.get(dir).push('RSC');

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
	for (const pageEntryPoint of clientEntryPoints.keys()) {
		const bundleDir = `${pageEntryPoint}/_client.jsx`;

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
const fetchUrl = \`/rsc/${pageEntryPoint}\`;

/**
 * Fetch your server component stream from \`/rsc/[route]\`
 * and render results into the root element as they come in.
 */
createFromFetch(fetch(fetchUrl)).then((comp) => {
    root.render(comp);
});
`;

		writeFile(resolveBuild(bundleDir), code);

		const clientEntryLists = clientEntryPoints.get(pageEntryPoint).map(async (entry) => {
			if (entry === 'RSC') return undefined;

			const destDir = path.relative(ROOT_DIRECTORY, entry);
			const tmep = destDir.split('/');

			tmep.pop();

			const dest = resolveCreateBuild(path.join(tmep.join('/')));

			fs.copy(entry, dest, (err) => {
				if (err) {
					console.error('Error copying the file:', err);
				} else {
					console.log('File copied successfully to:', resolveBuild(entry));
				}
			});

			await copyAndFixImports(entry, dest);

			return dest;
		});

		const entryPoints = [resolveBuild(bundleDir), ...(await Promise.all(clientEntryLists))].filter(
			Boolean
		);

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

// Function to build client and server bundles
async function build() {
	await buildRSC();
	await buildClient();
}

// Function to copy a file and update import paths
async function copyAndFixImports(src, dest) {
	try {
		// Read the source file
		let content = await readFile(src, 'utf-8');

		// Update import paths
		content = content.replace(/import\s+.*?from\s+['"](.*?)['"]/g, (match, importPath) => {
			// Resolve the absolute path of the import
			const resolvedPath = path.resolve(path.dirname(src), importPath);

			// Get the relative path from the destination file to the resolved import path
			const relativePath = path.relative(path.dirname(dest), resolvedPath);

			// Convert to a relative import path that can be used in the new location
			const updatedImportPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

			return match.replace(importPath, updatedImportPath);
		});

		// Write the updated content to the destination file
		await writeFile(dest, content, 'utf-8');
	} catch (err) {}
}
