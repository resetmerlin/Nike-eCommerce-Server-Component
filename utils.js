import { readdir } from 'fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const appDir = new URL('./app/', import.meta.url);
const buildDir = new URL('./build/', import.meta.url);

export function resolveApp(path = '') {
	return fileURLToPath(new URL(path, appDir));
}

export function resolveBuild(path = '') {
	return fileURLToPath(new URL(path, buildDir));
}

export function resolveCreateBuild(path = '') {
	const dir = fileURLToPath(new URL(path, buildDir));

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	return dir;
}

export async function getDirectories(source) {
	const dirents = await readdir(source, { withFileTypes: true });
	return dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
}

export async function getDirectoriesPath(source) {
	const dirents = await readdir(source, { withFileTypes: true });
	return dirents
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.parentPath + dirent.name);
}

/** Function to copy a file and update import paths  */
export async function updateImportPath(src, dest) {
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

		// Ensure the destination directory exists
		const destDir = path.dirname(dest);
		await mkdir(destDir, { recursive: true });

		// Write the updated content to the destination file
		await writeFile(dest, content, 'utf-8');
	} catch (err) {
		console.error(`Error writing file to ${dest}:`, err);
	}
}
