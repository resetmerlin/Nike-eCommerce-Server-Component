import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { build as esbuild } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import path, { relative, dirname } from 'node:path';
import { sassPlugin } from 'esbuild-sass-plugin';
import { readdir } from 'fs/promises';
import { renderSync } from 'sass';

const app = new Hono();
const clientComponentMap = {};

// Utility functions to resolve paths
const appDir = new URL('./app/', import.meta.url);
const buildDir = new URL('./build/', import.meta.url);
const rootDir = process.cwd();

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

// Function to build client and server bundles
async function build() {
	const clientEntryPoints = new Set();
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
							{ filter: reactComponentRegex },
							async ({ path: relativePath, importer }) => {
								if (relativePath.endsWith('.scss')) {
									return { external: true }; // Skip processing .scss files
								}

								let absolutePath;
								// Resolve relative and absolute paths properly
								if (relativePath.startsWith('.')) {
									absolutePath = path.resolve(path.dirname(importer), relativePath);
								} else {
									absolutePath = resolveApp(relativePath);
								}

								const contents = await readFile(absolutePath, 'utf-8');

								const relativeEntryPoint = path.relative(rootDir, absolutePath);

								if (!relativeEntryPoint.startsWith('app')) {
									if (contents.startsWith("'use client'")) {
										clientEntryPoints.add(absolutePath);
										return {
											external: true,
											path: resolveBuild(relativeEntryPoint).replace(reactComponentRegex, '.js')
										};
									}
								} else {
									if (contents.startsWith("'use client'")) {
										clientEntryPoints.add(absolutePath);
										return {
											external: true,
											path: relativePath.replace(reactComponentRegex, '.js')
										};
									}
								}
							}
						);
					}
				},
				sassPlugin()
			],
			loader: {
				'.png': 'file' // Loader for images
			}
		});
	}

	// Build client components
	const { outputFiles } = await esbuild({
		bundle: true,
		format: 'esm',
		logLevel: 'error',
		entryPoints: [resolveApp('_client.jsx')],
		outdir: resolveBuild(), // ensure output is correct
		splitting: true,
		write: false
	});

	for (let file of outputFiles) {
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
	}

	const entryPoints = [...clientEntryPoints];

	for (let index = 0; index < [...clientEntryPoints].length; index++) {
		const clientEntryPoint = entryPoints[index];

		const relativeEntryPoint = path.relative(rootDir, clientEntryPoint);

		const fuck = relativeEntryPoint.split('/');

		fuck.pop();

		const { outputFiles: clientOutputFiles } = await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints: [clientEntryPoint],
			outdir: `./build/${fuck.join('/')}`,
			splitting: true,
			write: false,
			plugins: [
				{
					name: 'inline-scss',
					setup(build) {
						// Resolve SCSS imports
						build.onResolve({ filter: /\.scss$/ }, async (args) => {
							const absolutePath = path.resolve(path.dirname(args.importer), args.path);
							return { path: absolutePath, namespace: 'scss' };
						});

						// Load SCSS and convert it to CSS
						build.onLoad({ filter: /.*/, namespace: 'scss' }, async (args) => {
							const result = renderSync({ file: args.path });
							return {
								contents: result.css.toString(),
								loader: 'css'
							};
						});
					}
				}
			]
		});

		for (let file of clientOutputFiles) {
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
		}
	}
}

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
            <script type="module" src="/build/_client.js"></script>
        </body>
        </html>
        `);
		});

		// Endpoint to render the server component to a stream
		app.get(`/rsc/${dir}`, async (c) => {
			const Page = await import(`./build/${dir}/page.js`);
			const Comp = createElement(Page.default);

			const stream = ReactServerDom.renderToReadableStream(Comp, clientComponentMap);
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
			port: 8930
		},
		(info) => {
			console.log(`Listening on http://localhost:${info.port}`);
		}
	);
}

startServer().catch((err) => {
	console.error('Failed to start the server:', err);
});
