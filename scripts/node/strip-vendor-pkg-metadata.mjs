#!/usr/bin/env node
// Strips publishing metadata from a vendor package.json, making it suitable
// for use as a private template-local package (no NPM publishing config).
//
// Changes applied:
//   - Sets "private": true
//   - Removes publishConfig.access, .provenance, .registry, .tag (and publishConfig root if empty after removals)
//   - Removes "repository", "license", "homepage", and "author" fields
//   - Removes "LICENSE" entry from the "files" array
//
// Usage: node strip-vendor-pkg-metadata.mjs --pkg=<path-to-package.json>

import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: { pkg: { type: 'string' } },
});

const pkgPath = values.pkg;
if (!pkgPath) {
	process.stderr.write('Error: --pkg is required\n');
	process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

pkg.private = true;

if (pkg.publishConfig && typeof pkg.publishConfig === 'object') {
	delete pkg.publishConfig.access;
	delete pkg.publishConfig.provenance;
	delete pkg.publishConfig.registry;
	delete pkg.publishConfig.tag;
}

if (pkg.publishConfig && Object.keys(pkg.publishConfig).length === 0) {
	delete pkg.publishConfig;
}

delete pkg.repository;
delete pkg.license;
delete pkg.homepage;
delete pkg.author;

if (Array.isArray(pkg.files)) {
	pkg.files = pkg.files.filter((entry) => entry !== 'LICENSE');
}

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);
process.stdout.write(`Stripped publishing metadata from ${pkgPath}\n`);
