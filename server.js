import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { build as esbuild } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
// this is for streaming
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import { relative } from 'node:path';
import { sassPlugin } from 'esbuild-sass-plugin';
import { readdir } from 'fs/promises';

const app = new Hono();
const clientComponentMap = {};

/**
 * Endpoint to serve your index route.
 * Includes the loader `/build/_client.js` to request your server component
 * and stream results into `<div id="root">`
 */
app.get('/', async (c) => {
	return c.html(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>React Server Components from Scratch</title>
		<script src="https://cdn.tailwindcss.com"></script>
		<link rel="stylesheet" href="/build/page.css">
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/build/_client.js"></script>
	</body>
	</html>
	`);
});

/**
 * Endpoint to render your server component to a stream.
 * This uses `react-server-dom-webpack` to parse React elements
 * into encoded virtual DOM elements for the client to read.
 */
app.get('/rsc', async (c) => {
	const directories = await getDirectories('./app');

	for (let dir = 0; dir < directories.length; dir++) {
		// Note This will raise a type error until you build with `npm run dev`
		const Page = await import(`./build/${directories[dir]}/page.js`);
		const Comp = createElement(Page.default);

		const stream = ReactServerDom.renderToReadableStream(Comp, clientComponentMap);
		return new Response(stream);
	}
});

/**
 * Serve your `build/` folder as static assets.
 * Allows you to serve built client components
 * to import from your browser.
 */
app.use('/build/*', serveStatic());

/**
 *  Serve static assets from the public folder for any other route
 */
app.use('/*', serveStatic({ root: './public' }));

/**
 * Build both server and client components with esbuild
 */
async function build() {
	const clientEntryPoints = new Set();

	const directories = await getDirectories('./app');

	for (let dir = 0; dir < directories.length; dir++) {
		/** Build the server component tree */
		await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints: [resolveApp(`${directories[dir]}/page.jsx`)],
			outdir: resolveBuild(`${directories[dir]}`),
			packages: 'external', // avoid bundling npm packages for server-side components
			plugins: [
				{
					name: 'resolve-client-imports',
					setup(build) {
						// Intercept component imports to check for 'use client'
						build.onResolve({ filter: reactComponentRegex }, async ({ path: relativePath }) => {
							const path = resolveApp(relativePath);

							const contents = await readFile(path, 'utf-8');

							if (contents.startsWith("'use client'")) {
								clientEntryPoints.add(path);
								return {
									// Avoid bundling client components into the server build.
									external: true,
									// Resolve the client import to the built `.js` file
									// created by the client `esbuild` process below.
									path: relativePath.replace(reactComponentRegex, '.js')
								};
							}
						});
					}
				},
				sassPlugin()
			],
			loader: {
				'.png': 'file' // Add other extensions if necessary, like '.jpg', '.svg', etc.
			}
		});
	}

	/** Build client components */
	const { outputFiles } = await esbuild({
		bundle: true,
		format: 'esm',
		logLevel: 'error',
		entryPoints: [resolveApp('_client.jsx'), ...clientEntryPoints],
		outdir: resolveBuild(),
		splitting: true,
		write: false
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

			clientComponentMap[key] = {
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

serve(
	{
		fetch: app.fetch,
		port: 8787
	},
	async (info) => {
		await build();
		console.log(`Listening on http://localhost:${info.port}`);
	}
);

/** UTILS */

const appDir = new URL('./app/', import.meta.url);
const componentDir = new URL('./components/', import.meta.url);
const buildDir = new URL('./build/', import.meta.url);

function resolveApp(path = '') {
	return fileURLToPath(new URL(path, appDir));
}

function resolveBuild(path = '') {
	return fileURLToPath(new URL(path, buildDir));
}

function resolveComponent(path = '') {
	return fileURLToPath(new URL(path, componentDir));
}

const reactComponentRegex = /\.jsx$/;

async function getDirectories(source) {
	const dirents = await readdir(source, { withFileTypes: true });
	return dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
}
