import { execSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { globSync } from 'glob';

const { values } = parseArgs({
	options: {
		check: { type: 'string' },
		'use-graph': { type: 'string', default: 'image' },
		'no-create-on-empty': { type: 'boolean', default: false },
		'output-dir-base': {
			type: 'string',
			default: './docs/dependency-graphs',
		},
	},
	allowPositionals: true,
});

const check = values.check ?? '';
const useGraph = values['use-graph'] ?? 'image';
const noCreateOnEmpty = values['no-create-on-empty'] ?? false;
const outputDirBase = values['output-dir-base'];

const graphPresets = {
	image: {
		madgeArgs: '',
		noCreateOnEmpty: false,
	},
	circular: {
		madgeArgs: '--circular',
		noCreateOnEmpty: true,
	},
	workspace: {
		madgeArgs: '',
		noCreateOnEmpty: false,
	},
};

const preset = graphPresets[useGraph];

if (!preset) {
	throw new Error(`Unknown --use-graph value: ${useGraph}`);
}

const checkPresets = {
	circular: {
		madgeArgs: '--circular',
	},
	orphans: {
		madgeArgs: '--orphans',
	},
};

const checkPreset = check ? checkPresets[check] : undefined;

if (check && !checkPreset) {
	throw new Error(`Unknown --check value: ${check}`);
}

const madgeArgsSegment = preset.madgeArgs ? `${preset.madgeArgs} ` : '';
const skipEmptyGraphs = noCreateOnEmpty || preset.noCreateOnEmpty;

const escapeDotString = (value) =>
	value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const renderWorkspaceGraph = () => {
	const packageJsonPaths = globSync([
		'./apps/*/package.json',
		'./packages/*/package.json',
		'./vendor/*/package.json',
	]);

	const workspacePackages = packageJsonPaths
		.map((packageJsonPath) => {
			const packageDir = dirname(packageJsonPath);
			const packageName = basename(packageDir);
			const normalizedPath = packageJsonPath
				.replaceAll('\\\\', '/')
				.replace(/^\.\//, '');
			const scope = normalizedPath.startsWith('apps/')
				? 'apps'
				: normalizedPath.startsWith('vendor/')
					? 'vendor'
					: 'packages';

			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
			const dependencies = {
				...packageJson.dependencies,
				...packageJson.devDependencies,
				...packageJson.peerDependencies,
				...packageJson.optionalDependencies,
			};

			return {
				dir: packageDir,
				scope,
				name: packageJson.name,
				label: packageJson.name?.replace(/^@md-oss\//, '') ?? packageName,
				dependencyNames: Object.keys(dependencies),
			};
		})
		.filter((workspacePackage) => Boolean(workspacePackage.name));

	const workspaceByName = new Map(
		workspacePackages.map((workspacePackage) => [
			workspacePackage.name,
			workspacePackage,
		])
	);

	const scopes = ['apps', 'packages', 'vendor'];

	// Generate per-scope graphs
	for (const scope of scopes) {
		const scopePackages = workspacePackages.filter(
			(workspacePackage) => workspacePackage.scope === scope
		);

		const scopePackageNames = new Set(
			scopePackages.map((workspacePackage) => workspacePackage.name)
		);

		const edges = [];
		const visibleNodeNames = new Set(scopePackageNames);

		for (const workspacePackage of scopePackages) {
			for (const dependencyName of workspacePackage.dependencyNames) {
				if (dependencyName === workspacePackage.name) {
					continue;
				}

				if (!workspaceByName.has(dependencyName)) {
					continue;
				}

				edges.push([workspacePackage.name, dependencyName]);
				visibleNodeNames.add(dependencyName);
			}
		}

		const visibleNodes = Array.from(visibleNodeNames)
			.map((name) => workspaceByName.get(name))
			.filter(Boolean)
			.sort((a, b) => a.label.localeCompare(b.label));

		const nodeLines = visibleNodes.map((node) => {
			const isScopeNode = scopePackageNames.has(node.name);
			const fillColor = isScopeNode ? '#1e293b' : '#0f172a';
			const borderColor = isScopeNode ? '#38bdf8' : '#64748b';
			const escapedName = escapeDotString(node.name);
			const escapedLabel = escapeDotString(node.label);

			return `  "${escapedName}" [label="${escapedLabel}", fillcolor="${fillColor}", color="${borderColor}"];`;
		});

		const edgeLines = edges
			.map(([source, target]) => {
				const escapedSource = escapeDotString(source);
				const escapedTarget = escapeDotString(target);
				return `  "${escapedSource}" -> "${escapedTarget}";`;
			})
			.sort((a, b) => a.localeCompare(b));

		const dotOutput = [
			'digraph G {',
			'  rankdir=LR;',
			'  graph [bgcolor="#202020", pad="0.2", nodesep="0.35", ranksep="0.55", fontcolor="#eeeeee"];',
			'  node [shape=box, style="rounded,filled", fontname="Helvetica", fontsize=10, fontcolor="#e2e8f0"];',
			'  edge [color="#94a3b8", arrowsize=0.7, penwidth=1.1];',
			`  label="Workspace dependency graph: ${scope}";`,
			'  labelloc=t;',
			'  fontsize=14;',
			...nodeLines,
			...edgeLines,
			'}',
		].join('\n');

		const outputPath = resolve(outputDirBase, 'workspace', `${scope}.svg`);
		const outputDir = dirname(outputPath);

		mkdirSync(outputDir, { recursive: true });

		const svgOutput = execSync('dot -Tsvg', {
			input: dotOutput,
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		writeFileSync(outputPath, svgOutput);
		console.info(
			`  ✓ Generated ${outputPath} (${scopePackages.length} scope nodes, ${edges.length} edges)`
		);
	}

	// Generate comprehensive graph with all packages
	const allPackageNames = new Set(
		workspacePackages.map((workspacePackage) => workspacePackage.name)
	);

	const allEdges = [];
	const allVisibleNodeNames = new Set(allPackageNames);

	for (const workspacePackage of workspacePackages) {
		for (const dependencyName of workspacePackage.dependencyNames) {
			if (dependencyName === workspacePackage.name) {
				continue;
			}

			if (!workspaceByName.has(dependencyName)) {
				continue;
			}

			allEdges.push([workspacePackage.name, dependencyName]);
			allVisibleNodeNames.add(dependencyName);
		}
	}

	const allVisibleNodes = Array.from(allVisibleNodeNames)
		.map((name) => workspaceByName.get(name))
		.filter(Boolean)
		.sort((a, b) => a.label.localeCompare(b.label));

	const allNodeLines = allVisibleNodes.map((node) => {
		const scopeColor = {
			apps: { fill: '#1e293b', border: '#38bdf8' },
			packages: { fill: '#1e3a3a', border: '#14b8a6' },
			vendor: { fill: '#3a2e1e', border: '#f59e0b' },
		};
		const colors = scopeColor[node.scope] || {
			fill: '#0f172a',
			border: '#64748b',
		};
		const escapedName = escapeDotString(node.name);
		const escapedLabel = escapeDotString(node.label);

		return `  "${escapedName}" [label="${escapedLabel}", fillcolor="${colors.fill}", color="${colors.border}"];`;
	});

	const allEdgeLines = allEdges
		.map(([source, target]) => {
			const escapedSource = escapeDotString(source);
			const escapedTarget = escapeDotString(target);
			return `  "${escapedSource}" -> "${escapedTarget}";`;
		})
		.sort((a, b) => a.localeCompare(b));

	const allDotOutput = [
		'digraph G {',
		'  rankdir=LR;',
		'  graph [bgcolor="#202020", pad="0.2", nodesep="0.35", ranksep="0.55", fontcolor="#eeeeee"];',
		'  node [shape=box, style="rounded,filled", fontname="Helvetica", fontsize=10, fontcolor="#e2e8f0"];',
		'  edge [color="#94a3b8", arrowsize=0.7, penwidth=1.1];',
		'  label="Complete workspace dependency graph";',
		'  labelloc=t;',
		'  fontsize=14;',
		...allNodeLines,
		...allEdgeLines,
		'}',
	].join('\n');

	const allOutputPath = resolve(outputDirBase, 'workspace', 'complete.svg');
	const allOutputDir = dirname(allOutputPath);

	mkdirSync(allOutputDir, { recursive: true });

	const allSvgOutput = execSync('dot -Tsvg', {
		input: allDotOutput,
		encoding: 'utf-8',
		stdio: ['pipe', 'pipe', 'pipe'],
	});

	writeFileSync(allOutputPath, allSvgOutput);
	console.info(
		`  ✓ Generated ${allOutputPath} (${workspacePackages.length} total nodes, ${allEdges.length} edges)`
	);
};

if (useGraph === 'workspace') {
	if (checkPreset) {
		throw new Error('--check cannot be combined with --use-graph=workspace');
	}

	console.info('Generating workspace-level package dependency graphs...');
	renderWorkspaceGraph();
	console.info('\n✓ Dependency graph generation complete!');
	process.exit(0);
}

const patterns = ['./vendor/*/src', './packages/*/src'];

// Find all package src directories
const srcDirs = [];
for (const pattern of patterns) {
	const matches = globSync(pattern);
	srcDirs.push(...matches.reverse());
}

console.info(`Found ${srcDirs.length} packages to analyze:\n`);

let hasFailures = false;

const dotMadgeRcOptions = () => {
	return JSON.stringify(
		{
			fileExtensions: ['ts', 'tsx', 'js', 'jsx'],
			excludeRegExp: [
				'node_modules',
				'.turbo',
				'dist',
				'build',
				'.next',
				'coverage',
			],
			detectiveOptions: {
				ts: {
					skipTypeImports: true,
					skipAsyncImports: false,
				},
				tsx: {
					skipTypeImports: true,
					skipAsyncImports: true,
				},
			},
		},
		null,
		2
	);
};

const withMadgeRc = (baseDir, fn) => {
	const tempMadgeRcPath = resolve(baseDir, '.madgerc');
	writeFileSync(tempMadgeRcPath, dotMadgeRcOptions());

	try {
		return fn();
	} finally {
		unlinkSync(tempMadgeRcPath);
	}
};

for (const srcDir of srcDirs) {
	const packageDir = dirname(srcDir);
	const packageName = basename(packageDir);
	const tsconfigPath = resolve(packageDir, 'tsconfig.json');

	// Check if tsconfig exists in package dir
	const hasTsconfig = existsSync(tsconfigPath);
	const tsconfigFlag = hasTsconfig ? '--ts-config ./tsconfig.json' : '';

	const scope = srcDir.includes('vendor/')
		? 'vendor'
		: srcDir.includes('apps/')
			? 'apps'
			: 'packages';
	const outputPath = resolve(outputDirBase, scope, `${packageName}.svg`);
	const outputDir = dirname(outputPath);

	console.info(`  📦 ${packageName}`);
	console.info(`     - Source: ${srcDir}`);
	console.info(`     - Scope: ${scope}`);
	console.info(`     - Output: ${outputPath}`);
	if (hasTsconfig) {
		console.info(`     - Using tsconfig: ${tsconfigPath}`);
	}

	if (checkPreset) {
		try {
			const report = withMadgeRc(packageDir, () =>
				execSync(
					`pnpm exec madge ${checkPreset.madgeArgs} ${tsconfigFlag} ./src`,
					{
						cwd: packageDir,
						encoding: 'utf-8',
						stdio: ['pipe', 'pipe', 'pipe'],
					}
				)
			);
			const trimmedReport = report.trim();

			if (trimmedReport) {
				console.info(trimmedReport);
			}

			if (check === 'orphans' && trimmedReport) {
				hasFailures = true;
				console.error(`     ✗ Found orphaned dependencies for ${packageName}`);
			} else {
				console.info(`     ✓ Checked ${packageName}`);
			}
		} catch (error) {
			const output = error.stdout?.toString?.() ?? error.stdout ?? '';

			if (output.trim()) {
				console.info(output.trimEnd());
			}

			hasFailures = true;
			console.error(`     ✗ Failed check for ${packageName}`);
		}

		continue;
	}

	try {
		// Ensure output directory exists
		mkdirSync(outputDir, { recursive: true });

		// Generate DOT first so empty circular graphs can be skipped cleanly.
		const dotOutput = withMadgeRc(packageDir, () =>
			execSync(
				`pnpm exec madge --debug ${madgeArgsSegment}--dot ${tsconfigFlag} ./src`,
				{
					cwd: packageDir,
					encoding: 'utf-8',
					stdio: ['pipe', 'pipe', 'pipe'],
				}
			)
		);

		if (skipEmptyGraphs && !dotOutput.includes('->')) {
			if (existsSync(outputPath)) {
				unlinkSync(outputPath);
			}

			console.info(`     ↷ Skipped empty graph for ${outputPath}`);
			continue;
		}

		const svgOutput = execSync('dot -Tsvg -Gbgcolor=#202020', {
			input: dotOutput,
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		writeFileSync(outputPath, svgOutput);
		console.info(`     ✓ Generated ${outputPath}`);
	} catch (error) {
		console.error(`     ✗ Failed to generate graph: ${error.message}`);
	}
}

if (checkPreset && hasFailures) {
	process.exitCode = 1;
}

console.info(
	checkPreset
		? hasFailures
			? '\n✖ Dependency check complete!'
			: '\n✓ Dependency check complete!'
		: '\n✓ Dependency graph generation complete!'
);
