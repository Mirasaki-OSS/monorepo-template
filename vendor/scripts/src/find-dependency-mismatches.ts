import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

type DependencyMap = Map<string, Map<string, string>>;
type DependencyType =
	| 'dependencies'
	| 'devDependencies'
	| 'peerDependencies'
	| 'optionalDependencies';

export type DependencyMismatches = Map<DependencyType, DependencyMap>;

export type FindDependencyMismatchesOptions = {
	cwd?: string;
	logger?: Pick<Console, 'debug'>;
};

const DEPENDENCY_TYPES = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
] as const satisfies readonly DependencyType[];

const findPackageJsonFiles = (cwd: string): string[] => {
	const pnpmWorkspaceFile = './pnpm-workspace.yaml';
	const pnpmWorkspace = fs.readFileSync(
		path.join(cwd, pnpmWorkspaceFile),
		'utf8'
	);
	const lines = pnpmWorkspace.split('\n');
	const packagesStartIdx = lines.findIndex((line) =>
		line.startsWith('packages:')
	);
	const nextSectionIdx = lines.findIndex(
		(line, idx) => idx > packagesStartIdx && /^[a-zA-Z]/.test(line)
	);
	const packagesLines = lines.slice(
		packagesStartIdx + 1,
		nextSectionIdx === -1 ? lines.length : nextSectionIdx
	);
	const workspacePackages = packagesLines
		.filter((line) => line.startsWith('  - '))
		.map((line) =>
			line.replace('  - ', '').replace('/*', '').replace(/['"]/g, '')
		)
		.filter((line) => !line.startsWith('!'));

	const workspacePackagePaths = workspacePackages.flatMap((dir) => {
		const allFoldersInDir = fs.readdirSync(path.join(cwd, dir));
		return allFoldersInDir.flatMap((folder) => {
			const folderPath = path.join(cwd, dir, folder);
			if (fs.statSync(folderPath).isDirectory()) {
				return folderPath;
			}
			return [];
		});
	});

	return workspacePackagePaths.map((pkgPath) =>
		path.join(pkgPath, 'package.json')
	);
};

const processDependencies = (
	dependenciesMap: DependencyMap,
	deps: Record<string, string>,
	packageName: string
) => {
	for (const [depName, depVersion] of Object.entries(deps)) {
		if (!dependenciesMap.has(depName)) {
			dependenciesMap.set(depName, new Map());
		}
		const depMap = dependenciesMap.get(depName);
		if (!depMap) {
			throw new Error('Unexpected missing dependency map');
		}
		depMap.set(packageName, depVersion);
	}
};

const findMismatches = (dependenciesMap: DependencyMap): DependencyMap => {
	const mismatches = new Map<string, Map<string, string>>();
	for (const [depName, packages] of dependenciesMap) {
		if (packages.size > 1) {
			const versions = Array.from(packages.values());
			const allSame = versions.every((v) => v === versions[0]);
			if (!allSame) {
				mismatches.set(depName, packages);
			}
		}
	}
	return mismatches;
};
export const findDependencyMismatches = ({
	cwd = process.cwd(),
	logger = console,
}: FindDependencyMismatchesOptions = {}): DependencyMismatches => {
	const packageJsonFiles = findPackageJsonFiles(cwd);
	const allDependencies = new Map<DependencyType, DependencyMap>(
		DEPENDENCY_TYPES.map((type) => [type, new Map()])
	);

	for (const packageJsonFile of packageJsonFiles) {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
		const packageName = packageJson.name;

		for (const depType of DEPENDENCY_TYPES) {
			const deps = packageJson[depType] || {};
			const depMap = allDependencies.get(depType);
			if (!depMap) {
				throw new Error('Unexpected missing dependency map');
			}
			processDependencies(depMap, deps, packageName);
		}

		logger.debug(`Processed ${packageName}`);
	}

	const allMismatches = new Map<DependencyType, DependencyMap>();
	for (const depType of DEPENDENCY_TYPES) {
		const depMap = allDependencies.get(depType);
		if (!depMap) {
			throw new Error('Unexpected missing dependency map');
		}
		const mismatches = findMismatches(depMap);
		if (mismatches.size > 0) {
			allMismatches.set(depType, mismatches);
		}
	}

	return allMismatches;
};

export const runFindDependencyMismatchesCli = (
	args: string[] = process.argv.slice(2)
): void => {
	const { values } = parseArgs({
		args,
		options: {
			cwd: {
				type: 'string',
			},
		},
	});

	const logger = console;
	const allMismatches = findDependencyMismatches({
		cwd: values.cwd,
		logger,
	});

	logger.debug();

	if (allMismatches.size === 0) {
		logger.debug('No dependency version mismatches found.');
		return;
	}

	for (const [depType, mismatches] of allMismatches) {
		logger.debug(`\nMismatched ${depType}:`);
		logger.debug(mismatches);
	}

	logger.debug();
	logger.debug('Dependency version mismatches found.');
	logger.debug(
		'Please align the versions in the respective package.json files, and make sure you run "pnpm install && pnpm dedupe" afterwards to update the lockfile.'
	);
};
