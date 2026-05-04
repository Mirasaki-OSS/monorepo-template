#!/usr/bin/env node
// Resolves the full workspace preserve list from an explicit input or built-in
// defaults, expanding each entry transitively to include all workspace-protocol
// dependencies (BFS).
//
// Outputs one resolved workspace path per line to stdout, e.g.:
//   apps/cli
//   packages/utils
//   vendor/config
//
// Usage:
//   node resolve-preserve-list.mjs --project-root=<path> [--preserve-list=<csv>]
//
// Default preserve list (when --preserve-list is omitted or empty):
//   apps/cli, packages/utils, vendor/config

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
];

const WORKSPACE_DIRS = ['apps', 'packages', 'vendor'];

/** Workspace paths preserved when no explicit --preserve-list is given. */
const DEFAULT_PRESERVE_LIST = ['apps/cli', 'packages/utils', 'vendor/config'];

// ---- helpers ----------------------------------------------------------------

function readJson(filePath) {
	return JSON.parse(readFileSync(filePath, 'utf8'));
}

function listSubdirs(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name);
}

/**
 * Reads all workspace package.json files and returns two lookup maps:
 *   byName  — npm package name  → { workspacePath, packageName, workspaceDeps }
 *   byPath  — workspace path    → { workspacePath, packageName, workspaceDeps }
 *
 * workspaceDeps is the list of npm package names that this workspace references
 * via a workspace: protocol dep spec.
 */
function collectWorkspaces(projectRoot) {
	const byName = new Map();
	const byPath = new Map();

	for (const dir of WORKSPACE_DIRS) {
		for (const name of listSubdirs(join(projectRoot, dir))) {
			const workspacePath = `${dir}/${name}`;
			const manifestPath = join(projectRoot, workspacePath, 'package.json');
			if (!existsSync(manifestPath)) continue;

			const pkg = readJson(manifestPath);
			if (typeof pkg.name !== 'string') continue;

			// Collect all workspace: dep names across every dep field
			const workspaceDeps = [];
			for (const field of DEPENDENCY_FIELDS) {
				const deps = pkg[field] ?? {};
				for (const [dep, spec] of Object.entries(deps)) {
					if (typeof spec === 'string' && spec.startsWith('workspace:')) {
						workspaceDeps.push(dep);
					}
				}
			}

			const info = { workspacePath, packageName: pkg.name, workspaceDeps };
			byName.set(pkg.name, info);
			byPath.set(workspacePath, info);
		}
	}

	return { byName, byPath };
}

/**
 * BFS from seed workspace paths.
 * For each workspace in the queue, follows workspace: deps and adds their
 * workspace paths to the resolved set until no new entries are found.
 */
function resolveTransitive(seeds, byName, byPath) {
	const resolved = new Set();
	const queue = [...seeds];

	while (queue.length > 0) {
		const workspacePath = queue.shift();
		if (resolved.has(workspacePath)) continue;
		resolved.add(workspacePath);

		const info = byPath.get(workspacePath);
		if (!info) continue;

		for (const depName of info.workspaceDeps) {
			const depInfo = byName.get(depName);
			if (depInfo && !resolved.has(depInfo.workspacePath)) {
				queue.push(depInfo.workspacePath);
			}
		}
	}

	return resolved;
}

// ---- main -------------------------------------------------------------------

const { values } = parseArgs({
	options: {
		'project-root': { type: 'string' },
		'preserve-list': { type: 'string', default: '' },
	},
});

const projectRoot = values['project-root'];
if (!projectRoot) {
	process.stderr.write('Error: --project-root is required\n');
	process.exit(1);
}

const rawList = values['preserve-list'] ?? '';
const seeds = rawList.trim()
	? rawList
			.split(/[,\s\n]+/)
			.map((s) => s.trim())
			.filter(Boolean)
	: [...DEFAULT_PRESERVE_LIST];

const { byName, byPath } = collectWorkspaces(projectRoot);

// Validate all seeds exist before resolving
for (const seed of seeds) {
	if (!byPath.has(seed)) {
		process.stderr.write(`Error: workspace not found: ${seed}\n`);
		process.exit(1);
	}
}

const resolved = resolveTransitive(seeds, byName, byPath);

// Output sorted workspace paths, one per line
for (const workspacePath of [...resolved].sort()) {
	process.stdout.write(`${workspacePath}\n`);
}
