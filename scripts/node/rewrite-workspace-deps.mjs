#!/usr/bin/env node
// Rewrites workspace: dependency specs to pinned published versions for any
// package that is no longer present locally in packages/ after template
// preparation (i.e. vendor packages that were not preserved).
//
// Manifests updated: root package.json, apps/*/package.json,
//   packages/*/package.json.
//
// Usage: node rewrite-workspace-deps.mjs --project-root=<path>

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
];

// ---- helpers ----------------------------------------------------------------

function readJson(filePath) {
	return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
	writeFileSync(filePath, `${JSON.stringify(value, null, '\t')}\n`);
}

function listManifests(baseDir) {
	if (!existsSync(baseDir)) return [];
	return readdirSync(baseDir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => join(baseDir, e.name, 'package.json'))
		.filter((p) => existsSync(p));
}

/**
 * Converts "workspace:<suffix>" to a concrete semver range using the
 * package's published version:
 *   workspace:^   → ^<version>
 *   workspace:~   → ~<version>
 *   workspace:*   → <version>  (exact)
 *   workspace:    → <version>  (exact, empty suffix)
 */
function resolveWorkspaceRange(spec, version) {
	const suffix = spec.slice('workspace:'.length);
	if (suffix === '' || suffix === '*') return version;
	if (suffix === '^' || suffix === '~') return `${suffix}${version}`;
	if (suffix.startsWith('^') || suffix.startsWith('~'))
		return `${suffix[0]}${version}`;
	// Path specs (e.g. workspace:./foo) are left unchanged
	if (suffix.startsWith('.') || suffix.startsWith('/')) return spec;
	return suffix;
}

// ---- main -------------------------------------------------------------------

const { values } = parseArgs({
	options: { 'project-root': { type: 'string' } },
});

const projectRoot = values['project-root'];
if (!projectRoot) {
	process.stderr.write('Error: --project-root is required\n');
	process.exit(1);
}

// Build a version map from all workspace dirs (vendor included so we can
// resolve packages that were NOT preserved and are about to be removed).
const knownVersions = new Map();
for (const dir of ['apps', 'packages', 'vendor']) {
	for (const manifestPath of listManifests(join(projectRoot, dir))) {
		const pkg = readJson(manifestPath);
		if (typeof pkg.name === 'string' && typeof pkg.version === 'string') {
			knownVersions.set(pkg.name, pkg.version);
		}
	}
}

// Packages still present locally (in packages/) — their workspace: specs stay.
const localPackages = new Set(
	listManifests(join(projectRoot, 'packages'))
		.map((p) => {
			const pkg = readJson(p);
			return typeof pkg.name === 'string' ? pkg.name : null;
		})
		.filter(Boolean)
);

const manifestsToUpdate = [
	join(projectRoot, 'package.json'),
	...listManifests(join(projectRoot, 'apps')),
	...listManifests(join(projectRoot, 'packages')),
].filter((p) => existsSync(p));

let updatedCount = 0;
for (const manifestPath of manifestsToUpdate) {
	const pkg = readJson(manifestPath);
	let changed = false;

	for (const field of DEPENDENCY_FIELDS) {
		const deps = pkg[field];
		if (!deps || typeof deps !== 'object') continue;

		for (const [name, spec] of Object.entries(deps)) {
			if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue;
			if (localPackages.has(name)) continue; // still local — keep workspace:

			const version = knownVersions.get(name);
			if (!version) continue; // unknown package, leave as-is

			const next = resolveWorkspaceRange(spec, version);
			if (next !== spec) {
				deps[name] = next;
				changed = true;
			}
		}
	}

	if (changed) {
		writeJson(manifestPath, pkg);
		updatedCount++;
	}
}

process.stdout.write(`Rewrote workspace deps in ${updatedCount} manifest(s)\n`);
