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
import { renderSync } from 'sass';
import { getDirectories, resolveApp, resolveBuild, resolveCreateBuild } from './utils.js';

const app = new Hono();
const CLIENT_COMPONENT_MAP = {};
const ROOT_DIRECTORY = process.cwd();
const REACT_COMPONENT_REGEX = /\.jsx$/;

/** Build Server Components and Add lists of client components */
async function buildRSC() {
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

								if (!contents.startsWith("'use client'")) return; // check it is not client component or not

								clientEntryPoints.add(absolutePath);
								// check is client component is outside of server component, ex: components/Product/index.jsx
								if (!entryDirLists.startsWith('app')) {
									return {
										external: true,
										// change import path into build components path ex: /home/resetmerlin/UbuntuCodeRepo/Nike-eCommerce-Server-Component/build/components/Product/index.js
										path: resolveBuild(entryDirLists).replace(REACT_COMPONENT_REGEX, '.js')
									};
								}

								return {
									external: true,
									path: absolutePath.replace(REACT_COMPONENT_REGEX, '.js')
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

	return { clientEntryPoints };
}

/** Build client components */
async function buildClient(clientEntryPoints) {
	// Build _client.jsx file
	await esbuild({
		bundle: true,
		format: 'esm',
		logLevel: 'error',
		entryPoints: [resolveApp('_client.jsx')],
		outdir: resolveBuild(),
		splitting: true,
		write: true
	});

	const outDirs = [...clientEntryPoints].map((entry) => {
		const relativeEntryPoint = path.relative(ROOT_DIRECTORY, entry);

		const fullPath = relativeEntryPoint.split('/');

		// hard coding
		if (relativeEntryPoint.endsWith('.jsx')) fullPath.pop(); // de

		return resolveCreateBuild(fullPath.join('/'));
	});

	outDirs.forEach(async (outdir) => {
		const { outputFiles } = await esbuild({
			bundle: true,
			format: 'esm',
			logLevel: 'error',
			entryPoints: [...clientEntryPoints],
			outdir,
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

		outputFiles.forEach(async (file) => {
			/**
		 *  Parse file export names
		 * 	@example
		 * {
				s: 136352,
				e: 136359,
				ls: 136333,
				le: 136348,
				n: 'default',
				ln: 'Product_default'
			  }
		 */
			const [, exports] = parse(file.text);
			let newContents = file.text;

			for (const exp of exports) {
				const key = file.path + exp.n;

				CLIENT_COMPONENT_MAP[key] = {
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
	});
}
// Function to build client and server bundles
async function build() {
	const { clientEntryPoints } = await buildRSC();
	await buildClient(clientEntryPoints);
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
