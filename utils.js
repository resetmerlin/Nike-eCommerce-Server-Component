import { readdir } from 'fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
