import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { build as esbuild } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import { relative } from 'node:path';
import { sassPlugin } from 'esbuild-sass-plugin';
import { readdir } from 'fs/promises';

const app = new Hono();
const clientComponentMap = {};

// Utility functions to resolve paths
const appDir = new URL('./app/', import.meta.url);
const buildDir = new URL('./build/', import.meta.url);

function resolveApp(path = '') {
	return fileURLToPath(new URL(path, appDir));
}

function resolveBuild(path = '') {
	return fileURLToPath(new URL(path, buildDir));
}

const reactComponentRegex = /\.jsx$/;

async function getDirectories(source) {
	const dirents = await readdir(source, { withFileTypes: true });
	return dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
}

// Fetching all directories within the 'app' directory
const directories = await getDirectories(resolveApp(''));

// Dynamically create routes based on directories
for (let index = 0; index < directories.length; index++) {
	app.get(`/${directories[index]}`, async (c) => {
		return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>React Server Components from Scratch</title>
            <link rel="stylesheet" href="/build/${directories[index]}/page.css">
        </head>
        <body>
            <div id="root"></div>
            <script type="module" src="/build/_client.js"></script>
        </body>
        </html>
        `);
	});
}

// Endpoint to render server component to a stream
app.get('/rsc', async (c) => {
	for (let dir = 0; dir < directories.length; dir++) {
		const Page = await import(`./build/${directories[dir]}/page.js`);
		const Comp = createElement(Page.default);

		const stream = ReactServerDom.renderToReadableStream(Comp, clientComponentMap);
		return new Response(stream);
	}
});

// Serve static assets from 'build' and 'public' directories
app.use('/build/*', serveStatic());
app.use('/*', serveStatic({ root: './public' }));

// Build function to compile server and client components
async function build() {
	const clientEntryPoints = new Set();

	for (let dir = 0; dir < directories.length; dir++) {
		await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints: [resolveApp(`${directories[dir]}/page.jsx`)],
			outdir: resolveBuild(`${directories[dir]}`),
			packages: 'external',
			plugins: [
				{
					name: 'resolve-client-imports',
					setup(build) {
						build.onResolve({ filter: reactComponentRegex }, async ({ path: relativePath }) => {
							const path = resolveApp(relativePath);
							const contents = await readFile(path, 'utf-8');

							if (contents.startsWith("'use client'")) {
								clientEntryPoints.add(path);
								return {
									external: true,
									path: relativePath.replace(reactComponentRegex, '.js')
								};
							}
						});
					}
				},
				sassPlugin()
			],
			loader: {
				'.png': 'file'
			}
		});
	}

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
		const [, exports] = parse(file.text);
		let newContents = file.text;

		for (const exp of exports) {
			const key = file.path + exp.n;
			clientComponentMap[key] = {
				id: `/build/${relative(resolveBuild(), file.path)}`,
				name: exp.n,
				chunks: [],
				async: true
			};

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
