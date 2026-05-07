#!/usr/bin/env node
// Dynamically copies an app and all its transitive workspace: dependencies
// into the Docker build context.
//
// Usage: node copy-app-sources.js <workspace-root> <dest-root> <app-name>
//
// Only packages referenced via the `workspace:` protocol are copied.
// Packages whose versions have been replaced with published semver ranges
// (e.g. during monorepo template personalization) are automatically skipped.

const fs = require('node:fs');
const path = require('node:path');

const [, , workspaceRoot, destRoot, appName] = process.argv;

if (!workspaceRoot || !destRoot || !appName) {
	console.error(
		'Usage: node copy-app-sources.js <workspace-root> <dest-root> <app-name>'
	);
	process.exit(1);
}

function parseWorkspaceGlobs(root) {
	const content = fs.readFileSync(
		path.join(root, 'pnpm-workspace.yaml'),
		'utf8'
	);
	const globs = [];
	let inPackages = false;
	for (const line of content.split('\n')) {
		if (/^packages\s*:/.test(line)) {
			inPackages = true;
			continue;
		}
		if (!inPackages) continue;
		// Stop on a new top-level YAML key
		if (line.trim() && !line.trim().startsWith('#') && !/^\s/.test(line)) break;
		const match = line.match(/^\s+-\s+['"]?([^'"#\s]+)['"]?/);
		if (match) globs.push(match[1]);
	}
	return globs;
}

function buildPackageMap(root, globs) {
	const map = new Map(); // package-name -> workspace-relative path
	for (const glob of globs) {
		if (!glob.endsWith('/*')) continue;
		const dir = glob.slice(0, -2);
		const fullDir = path.join(root, dir);
		if (!fs.existsSync(fullDir)) continue;
		for (const entry of fs.readdirSync(fullDir)) {
			const pkgJsonPath = path.join(fullDir, entry, 'package.json');
			if (!fs.existsSync(pkgJsonPath)) continue;
			try {
				const { name } = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
				if (name) map.set(name, path.join(dir, entry));
			} catch {
				// skip malformed package.json
			}
		}
	}
	return map;
}

function collectWorkspaceDeps(pkgName, pkgMap, visited = new Set()) {
	if (visited.has(pkgName)) return visited;
	visited.add(pkgName);

	const relPath = pkgMap.get(pkgName);
	if (!relPath) return visited;

	let pkg;
	try {
		pkg = JSON.parse(
			fs.readFileSync(path.join(workspaceRoot, relPath, 'package.json'), 'utf8')
		);
	} catch {
		return visited;
	}

	const allDeps = Object.assign(
		{},
		pkg.dependencies,
		pkg.devDependencies,
		pkg.peerDependencies
	);
	for (const [dep, version] of Object.entries(allDeps)) {
		if (typeof version === 'string' && version.startsWith('workspace:')) {
			collectWorkspaceDeps(dep, pkgMap, visited);
		}
	}
	return visited;
}

function copyDir(src, dest) {
	fs.mkdirSync(dest, { recursive: true });
	for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
		if (entry.name === 'node_modules') continue;
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else if (entry.isFile()) {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

const globs = parseWorkspaceGlobs(workspaceRoot);
const pkgMap = buildPackageMap(workspaceRoot, globs);
const deps = collectWorkspaceDeps(appName, pkgMap);

console.log(`Resolved workspace: deps for ${appName}:`);
for (const name of deps) {
	const relPath = pkgMap.get(name);
	if (!relPath) continue;
	const src = path.join(workspaceRoot, relPath);
	const dest = path.join(destRoot, relPath);
	console.log(`  copying ${relPath}`);
	copyDir(src, dest);
}
