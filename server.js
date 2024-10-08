import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { build as esbuild } from 'esbuild';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import path, { relative } from 'node:path';
import { sassPlugin } from 'esbuild-sass-plugin';
import { glob } from 'glob';
import { resolveApp, resolveBuild, resolveCreateBuild, updateImportPath } from './utils.js';

const app = new Hono();
const CLIENT_COMPONENT_MAP = {};
const clientEntryPoints = new Map();
const ROOT_DIRECTORY = process.cwd();
const REACT_COMPONENT_REGEX = /\.jsx$/;
const APP_DIR_NAME = 'app';

/** Use glob to find all `page.jsx` files in the `app` directory */
const filesPath = await glob(resolveApp('**/page.jsx'));

const routes = [...filesPath].map((filePath) => {
	const parentDirName = path.basename(path.dirname(filePath));
	return parentDirName === APP_DIR_NAME ? `/` : parentDirName;
});

// Function to dynamically create routes based on the directories
async function createRoutesBasedOnApp() {
	for (let i = 0; i < routes.length; i++) {
		const routeName = `/${routes[i]}`;

		app.get(`${routeName}`, async (c) => {
			return c.html(`
				<!DOCTYPE html>
				<html>
				<head>
					<link rel="stylesheet" href="/build${routeName}/page.css">
				</head>
				<body>
					<div id="root"></div>
				<script type="module" src="/build${routeName}/_client.js"></script>
				</body>
				</html>
			`);
		});

		// Endpoint to render the server component to a stream
		app.get(`/rsc${routeName}`, async (c) => {
			const Page = await import(`./build${routeName}/page.js`);
			const Comp = createElement(Page.default);

			const stream = ReactServerDom.renderToReadableStream(Comp, CLIENT_COMPONENT_MAP);
			return new Response(stream);
		});
	}
}

app.use('/build/*', serveStatic());
app.use('/*', serveStatic({ root: './public' }));

// Initialize and start the server
async function startServer() {
	await buildRSC();
	await buildClient();
	await createRoutesBasedOnApp();

	serve(
		{
			fetch: app.fetch,
			port: 1582
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
 *  @description Build Server Components and Add lists of client components
 * */
async function buildRSC() {
	for (let route of routes) {
		await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints: [resolveApp(`${route}/page.jsx`)],
			outdir: resolveBuild(route),
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

								const absolutePath = relativePath.startsWith('.')
									? path.resolve(path.dirname(importer), relativePath)
									: resolveApp(relativePath);

								const entryDirLists = path.relative(ROOT_DIRECTORY, absolutePath);
								const contents = await readFile(absolutePath, 'utf-8');

								// Needs to bundle client component and server component separately. so add client components path to build later
								if (!contents.startsWith("'use client'")) {
									const entryPoints = [path.join(resolveBuild(route), '_client.jsx')];
									const outdir = resolveBuild(route);

									await esbuildCient(entryPoints, outdir);

									return;
								}

								if (!clientEntryPoints.has(route)) {
									// If the key does not exist, initialize it with an empty array
									clientEntryPoints.set(route, []);
								}
								// Push the new value to the existing array
								clientEntryPoints.get(route).push(absolutePath);

								// check is client component is outside of server component, ex: components/Product/index.jsx
								return {
									external: true,
									// change import path into build components path ex: rootDir/build/components/Product/index.js
									path: resolveBuild(entryDirLists).replace(REACT_COMPONENT_REGEX, '.js')
								};
							}
						);
					}
				},
				sassPlugin()
			]
		});
	}
}

/** Build client components */
async function buildClient() {
	for (const pageEntryPoint of clientEntryPoints.keys()) {
		const clientEntryLists = clientEntryPoints.get(pageEntryPoint).map(async (entry) => {
			const fileName = path.basename(entry);
			const parentName = path.dirname(entry);

			const directoryInsideBuildDir = resolveCreateBuild(path.relative(ROOT_DIRECTORY, parentName));

			const fullPath = path.join(directoryInsideBuildDir, fileName);

			await copyFile(entry, fullPath);

			await updateImportPath(entry, fullPath);

			return fullPath;
		});

		const promisedClientEntryLists = await Promise.all(clientEntryLists);

		const entryPoints = [
			...promisedClientEntryLists,
			path.join(resolveBuild(pageEntryPoint), '_client.jsx')
		];

		await esbuildCient(entryPoints, resolveBuild());
	}
}

async function esbuildCient(entryPoints, outdir) {
	const { outputFiles } = await esbuild({
		bundle: true,
		format: 'esm',
		logLevel: 'error',
		entryPoints,
		outdir,
		splitting: true,
		write: false,
		plugins: [sassPlugin()],
		loader: {
			'.jsx': 'jsx',
			'.scss': 'css'
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
