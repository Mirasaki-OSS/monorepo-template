#!/usr/bin/env -S pnpm tsx
import { execSync } from 'node:child_process';
// Example: ./scripts/node/replace-scope.ts --scopeOld="@md-oss" --scopeNew="@mirasaki-oss" --paths="./.changeset/*,./vendor,./apps,./packages"
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { glob } from 'glob';

interface Args {
	scopeOld: string;
	scopeNew: string;
	paths: string;
}

// Parse CLI arguments
const { values } = parseArgs({
	options: {
		scopeOld: { type: 'string' },
		scopeNew: { type: 'string' },
		paths: { type: 'string' },
	},
});

const args = values as Partial<Args>;

if (!args.scopeOld || !args.scopeNew || !args.paths) {
	console.error(
		'Usage: tsx replace-scope.ts --scopeOld="@old-scope" --scopeNew="@new-scope" --paths="./vendor/*,./apps,./packages"'
	);
	process.exit(1);
}

const { scopeOld, scopeNew, paths } = args as Args;

// Split paths by comma
const pathList = paths.split(',').map((p) => p.trim());

console.log(
	`Replacing ${scopeOld} with ${scopeNew} in ${pathList.length} path(s)`
);

// Find all files from all paths
const allFiles = new Set<string>();
for (const path of pathList) {
	// If path already contains a glob pattern (ends with *), use it directly
	const globPattern = path.endsWith('*') ? path : `${path}/**/*`;
	const files = glob.sync(globPattern, {
		ignore: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],
		nodir: true,
	});
	files.forEach((f) => void allFiles.add(f));
}

const files = Array.from(allFiles);
console.log(`Found ${files.length} files to process`);

let totalReplacements = 0;
const modifiedFiles: string[] = [];

for (const filePath of files) {
	try {
		const content = readFileSync(filePath, 'utf-8');

		// Check if file contains the old scope
		if (!content.includes(scopeOld)) {
			continue;
		}

		// Replace all occurrences
		const newContent = content.replaceAll(scopeOld, scopeNew);

		if (newContent !== content) {
			writeFileSync(filePath, newContent, 'utf-8');
			modifiedFiles.push(filePath);
			totalReplacements++;
			console.log(`  ✓ Updated ${filePath}`);
		}
	} catch (error) {
		console.error(`  ✗ Failed to process ${filePath}:`, error);
	}
}

console.log(`\n✓ Replaced scope in ${totalReplacements} file(s)`);

// Format modified files
if (modifiedFiles.length > 0) {
	console.log('Formatting modified files...');
	try {
		execSync(`pnpm exec biome format --write ${modifiedFiles.join(' ')}`, {
			stdio: 'inherit',
		});
	} catch {
		// Biome might fail on some file types, ignore
		console.log('Note: Some files could not be formatted');
	}
}

console.log('Done.');
