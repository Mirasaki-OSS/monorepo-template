#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const distEntry = path.join(
	packageRoot,
	'dist/apply-package-publish-config.mjs'
);

if (existsSync(distEntry)) {
	const module = await import(pathToFileURL(distEntry).href);
	await module.runApplyPackagePublishConfigCliWithExitHandling(
		process.argv.slice(2)
	);
	process.exit(0);
}

const result = spawnSync('tsx', [
	path.join(packageRoot, 'src/apply-package-publish-config.ts'),
	...process.argv.slice(2),
]);
process.exitCode = result.status ?? 1;
