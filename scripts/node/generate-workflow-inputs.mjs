#!/usr/bin/env node
// Generates the workflow_dispatch.inputs section (one boolean checkbox per
// workspace) and the "Build preserve list" step inside
// .github/workflows/prepare-template.yaml.
//
// Re-run whenever workspaces are added or removed:
//   node scripts/node/generate-workflow-inputs.mjs
//
// The two generated sections are delimited by marker comments so the rest of
// the workflow file is untouched.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const WORKFLOW_PATH = join(
	PROJECT_ROOT,
	'.github/workflows/prepare-template.yaml'
);

const WORKSPACE_DIRS = ['apps', 'packages', 'vendor'];

/**
 * Workspace paths checked by default.
 * Must match DEFAULT_PRESERVE_LIST in resolve-preserve-list.mjs.
 */
const DEFAULT_CHECKED = new Set([
	'apps/cli',
	'packages/utils',
	'vendor/config',
]);

const MAX_INPUTS = 25;

// Marker pairs that delimit the two generated sections in the workflow file.
const MARKERS = {
	inputs: {
		start: '      # GEN:START:INPUTS',
		end: '      # GEN:END:INPUTS',
	},
	step: {
		start: '      # GEN:START:PRESERVE-STEP',
		end: '      # GEN:END:PRESERVE-STEP',
	},
};

// ---- helpers ----------------------------------------------------------------

function listSubdirs(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();
}

function readPackageJson(dir) {
	const p = join(dir, 'package.json');
	if (!existsSync(p)) return {};
	try {
		return JSON.parse(readFileSync(p, 'utf8'));
	} catch {
		return {};
	}
}

/**
 * Converts a workspace path to a valid GitHub Actions input key.
 * e.g. "vendor/design-system" → "vendor-design-system"
 */
function inputKey(workspacePath) {
	return workspacePath.replace('/', '-');
}

function replaceSection(text, startMarker, endMarker, newContent) {
	const si = text.indexOf(startMarker);
	const ei = text.indexOf(endMarker);
	if (si === -1)
		throw new Error(`Marker not found in workflow: "${startMarker}"`);
	if (ei === -1)
		throw new Error(`Marker not found in workflow: "${endMarker}"`);
	if (si > ei) throw new Error(`Start marker appears after end marker`);
	return (
		text.slice(0, si + startMarker.length) +
		'\n' +
		newContent +
		'\n' +
		text.slice(ei)
	);
}

// ---- collect workspaces -----------------------------------------------------

const workspaces = [];
for (const dir of WORKSPACE_DIRS) {
	for (const name of listSubdirs(join(PROJECT_ROOT, dir))) {
		const workspacePath = `${dir}/${name}`;
		const pkg = readPackageJson(join(PROJECT_ROOT, workspacePath));
		workspaces.push({ workspacePath, pkg });
	}
}

if (workspaces.length > MAX_INPUTS) {
	process.stderr.write(
		`Error: ${workspaces.length} workspaces exceed the GitHub Actions ` +
			`workflow_dispatch input limit of ${MAX_INPUTS}.\n` +
			`Remove unused workspaces or split the workflow before re-running.\n`
	);
	process.exit(1);
}

process.stdout.write(
	`Found ${workspaces.length} workspaces (limit: ${MAX_INPUTS})\n`
);

// ---- generate inputs block --------------------------------------------------
//
// Produces YAML like:
//   apps-cli:
//     description: "apps/cli (@md-oss/cli) — CLI application"
//     type: boolean
//     default: true

const inputLines = [];
for (const { workspacePath, pkg } of workspaces) {
	const key = inputKey(workspacePath);
	const pkgName = typeof pkg.name === 'string' ? pkg.name : workspacePath;
	const descSuffix =
		typeof pkg.description === 'string' && pkg.description.length > 0
			? ` — ${pkg.description}`
			: '';
	const description = `${workspacePath} (${pkgName}${descSuffix})`;
	const isDefault = DEFAULT_CHECKED.has(workspacePath);

	inputLines.push(
		`      ${key}:`,
		`        description: "${description}"`,
		`        type: boolean`,
		`        default: ${isDefault}`
	);
}

const inputsBlock = inputLines.join('\n');

// ---- generate preserve step -------------------------------------------------
//
// Produces a step that converts the boolean inputs into a comma-separated
// PRESERVE_LIST string written to GITHUB_OUTPUT.
//
// When triggered by `push` (no workflow_dispatch inputs), all expressions
// evaluate to empty string, so the list is empty and preserve-packages.sh
// falls back to its built-in defaults.

const condLines = workspaces.map(({ workspacePath }) => {
	const key = inputKey(workspacePath);
	// \${{ prevents JS template interpolation while producing literal ${{ }}
	return `          [[ "\${{ inputs.${key} }}" == "true" ]] && list+=(${workspacePath})`;
});

const preserveStep = [
	`      - name: Build preserve list from checkbox inputs`,
	`        id: preserve`,
	`        shell: bash`,
	`        run: |`,
	`          list=()`,
	...condLines,
	`          result=""`,
	`          for item in "\${list[@]}"; do`,
	`            result="\${result:+\${result},}\${item}"`,
	`          done`,
	`          echo "list=\${result}" >> "$GITHUB_OUTPUT"`,
].join('\n');

// ---- update workflow file ---------------------------------------------------

if (!existsSync(WORKFLOW_PATH)) {
	process.stderr.write(`Error: workflow file not found: ${WORKFLOW_PATH}\n`);
	process.exit(1);
}

let workflow = readFileSync(WORKFLOW_PATH, 'utf8');
workflow = replaceSection(
	workflow,
	MARKERS.inputs.start,
	MARKERS.inputs.end,
	inputsBlock
);
workflow = replaceSection(
	workflow,
	MARKERS.step.start,
	MARKERS.step.end,
	preserveStep
);
writeFileSync(WORKFLOW_PATH, workflow);

process.stdout.write(`Updated ${WORKFLOW_PATH}\n`);
