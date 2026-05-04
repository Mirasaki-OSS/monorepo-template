#!/usr/bin/env node
// Removes Docker artifacts for apps that no longer exist in the workspace.
//
// For each known app Dockerfile (docker/apps/<app>.Dockerfile):
//   - If apps/<app> does not exist, delete the Dockerfile and remove the
//     corresponding service block from compose.prod.yaml.
//
// Usage:
//   node cleanup-docker-artifacts.mjs --project-root=<path>

import {
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: {
		'project-root': { type: 'string' },
	},
});

const projectRoot = values['project-root'];
if (!projectRoot) {
	console.error('--project-root is required');
	process.exit(1);
}

const dockerfilesDir = join(projectRoot, 'docker', 'apps');
const composePath = join(projectRoot, 'docker', 'compose', 'compose.prod.yaml');

if (!existsSync(dockerfilesDir)) process.exit(0);

const dockerfiles = readdirSync(dockerfilesDir).filter((f) =>
	f.endsWith('.Dockerfile')
);

const removed = [];

for (const filename of dockerfiles) {
	const appName = filename.replace(/\.Dockerfile$/, '');
	const appDir = join(projectRoot, 'apps', appName);

	if (!existsSync(appDir)) {
		const dockerfilePath = join(dockerfilesDir, filename);
		rmSync(dockerfilePath);
		console.log(`Removed Dockerfile: docker/apps/${filename}`);
		removed.push(appName);
	}
}

if (removed.length === 0) {
	console.log('No Docker artifacts to clean up.');
	process.exit(0);
}

// Remove service blocks from compose.prod.yaml
if (!existsSync(composePath)) process.exit(0);

let compose = readFileSync(composePath, 'utf8');

for (const appName of removed) {
	// A service block starts at the line "  <name>:" (exactly 2-space indent)
	// and ends just before the next such line or end of file.
	// We match greedily from the service header to the next top-level services
	// entry or EOF. The `s` flag makes . match newlines.
	const serviceBlockRe = new RegExp(
		`\\n  ${appName}:(?:.|\\n)*?(?=\\n  [a-zA-Z_][a-zA-Z0-9_-]*:|$)`,
		'g'
	);
	const before = compose;
	compose = compose.replace(serviceBlockRe, '');
	if (compose !== before) {
		console.log(`Removed service block '${appName}' from compose.prod.yaml`);
	}
}

// Strip dangling depends_on entries that reference removed services.
// Handles both long form (  server:\n    condition: ...) and short form (  - server).
for (const appName of removed) {
	// Long form: "      <name>:\n" followed by deeper-indented lines
	const longFormRe = new RegExp(
		`\\n([ ]+)${appName}:\\n(?:\\1 [^\\n]*\\n)*`,
		'g'
	);
	// Short form: "      - <name>" list entry
	const shortFormRe = new RegExp(`\\n[ ]+-[ ]+${appName}\\b[^\\n]*`, 'g');

	compose = compose.replace(longFormRe, '\n');
	compose = compose.replace(shortFormRe, '');
}

// Remove depends_on blocks that became empty after stripping entries.
// An empty depends_on has no deeper-indented child on the next non-blank line.
compose = compose.replace(/\n([ ]+)depends_on:\n(?=\1[^ ]|\n)/g, '\n');

writeFileSync(composePath, compose, 'utf8');
