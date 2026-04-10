#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const distEntry = path.join(packageRoot, 'dist/find-dependency-mismatches.mjs');

if (existsSync(distEntry)) {
	const module = await import(pathToFileURL(distEntry).href);
	module.runFindDependencyMismatchesCli(process.argv.slice(2));
	process.exit(0);
}

const sourceCli = path.join(
	packageRoot,
	'src/find-dependency-mismatches-cli.ts'
);
const result = spawnSync(
	process.execPath,
	['--import', 'tsx', sourceCli, ...process.argv.slice(2)],
	{ stdio: 'inherit' }
);

if (typeof result.status === 'number') {
	process.exit(result.status);
}

process.exit(1);
