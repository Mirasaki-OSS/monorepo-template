#!/usr/bin/env node
// Restores dependency keys for non-local scoped packages back to @md-oss/*.
//
// Why this exists:
// personalize.sh updates owner references, which correctly rewrites local
// workspace package names to the new owner scope. But published, non-local
// dependencies must remain on the published scope (@md-oss/*), otherwise the
// generated repository points to packages that do not exist.
//
// Usage:
//   node restore-nonlocal-scoped-deps.mjs --project-root=<path> --new-owner=<owner>

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const DEP_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
];

function readJson(filePath) {
	return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
	writeFileSync(filePath, `${JSON.stringify(value, null, '\t')}\n`);
}

function listWorkspaceManifests(baseDir) {
	if (!existsSync(baseDir)) return [];
	return readdirSync(baseDir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => join(baseDir, e.name, 'package.json'))
		.filter((p) => existsSync(p));
}

const { values } = parseArgs({
	options: {
		'project-root': { type: 'string' },
		'new-owner': { type: 'string' },
	},
});

const projectRoot = values['project-root'];
const newOwner = values['new-owner'];
if (!projectRoot) {
	process.stderr.write('Error: --project-root is required\\n');
	process.exit(1);
}
if (!newOwner) {
	process.stderr.write('Error: --new-owner is required\\n');
	process.exit(1);
}

const targetScope = `@${newOwner}/`;
const publishedScope = '@md-oss/';

// Local package names that should keep the new owner scope.
const localPackageNames = new Set();
for (const dir of ['apps', 'packages']) {
	for (const manifestPath of listWorkspaceManifests(join(projectRoot, dir))) {
		const pkg = readJson(manifestPath);
		if (typeof pkg.name === 'string') {
			localPackageNames.add(pkg.name);
		}
	}
}

const manifests = [
	join(projectRoot, 'package.json'),
	...listWorkspaceManifests(join(projectRoot, 'apps')),
	...listWorkspaceManifests(join(projectRoot, 'packages')),
].filter((p) => existsSync(p));

let updated = 0;
for (const manifestPath of manifests) {
	const pkg = readJson(manifestPath);
	let changed = false;

	for (const field of DEP_FIELDS) {
		const deps = pkg[field];
		if (!deps || typeof deps !== 'object') continue;

		const nextEntries = [];
		for (const [name, version] of Object.entries(deps)) {
			if (!name.startsWith(targetScope) || localPackageNames.has(name)) {
				nextEntries.push([name, version]);
				continue;
			}

			const suffix = name.slice(targetScope.length);
			const restored = `${publishedScope}${suffix}`;
			nextEntries.push([restored, version]);
			changed = true;
		}

		if (changed) {
			pkg[field] = Object.fromEntries(nextEntries);
		}
	}

	if (changed) {
		writeJson(manifestPath, pkg);
		updated += 1;
	}
}

process.stdout.write(
	`Restored non-local scoped deps in ${updated} manifest(s)\\n`
);
