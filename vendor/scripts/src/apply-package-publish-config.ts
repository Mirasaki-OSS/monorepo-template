import { parseArgs } from 'node:util';
import { getErrorMessage, isRecord } from './helpers';
import {
	type JsonRecord,
	type PackageJsonWithExports,
	readPackageJson,
	writePackageJson,
} from './package-json';

export type ApplyPackagePublishConfigOptions = {
	cwd?: string;
	packageJsonPath?: string;
	dryRun?: boolean;
};

type ApplyPublishConfigResult = {
	packageJson: PackageJsonWithExports;
	appliedKeys: string[];
	skippedKeys: string[];
};

const applyPublishConfig = (
	packageJson: PackageJsonWithExports
): ApplyPublishConfigResult => {
	if (!packageJson.publishConfig || !isRecord(packageJson.publishConfig)) {
		return {
			packageJson,
			appliedKeys: [],
			skippedKeys: [],
		};
	}

	// Create a new package.json with publishConfig fields applied to root
	const nextPackageJson: JsonRecord = { ...packageJson };
	const publishConfig = packageJson.publishConfig as JsonRecord;

	// Exclude npm/pnpm registry and distribution metadata fields that should not be applied to root
	const excludedKeys = new Set([
		'registry',
		'access',
		'tag',
		'directory',
		'provenance',
		'@npmjs:bypass-log-bin',
	]);

	const appliedKeys: string[] = [];
	const skippedKeys: string[] = [];

	for (const [key, value] of Object.entries(publishConfig)) {
		if (excludedKeys.has(key)) {
			skippedKeys.push(key);
			console.debug(
				`Skipping publishConfig field "${key}" as it is npm/pnpm registry metadata.`
			);
			continue;
		}
		if (key in nextPackageJson) {
			console.warn(
				`Warning: publishConfig field "${key}" will overwrite existing root field with value "${nextPackageJson[key]}".`
			);
		}
		appliedKeys.push(key);
		nextPackageJson[key] = value;
	}

	// Only remove publishConfig if all fields were applied (no excluded keys remain)
	if (skippedKeys.length === 0) {
		delete nextPackageJson.publishConfig;
	} else {
		// Keep only excluded fields in publishConfig
		const nextPublishConfig: JsonRecord = {};
		for (const key of skippedKeys) {
			nextPublishConfig[key] = publishConfig[key];
		}
		nextPackageJson.publishConfig = nextPublishConfig;
	}

	return {
		packageJson: nextPackageJson as PackageJsonWithExports,
		appliedKeys,
		skippedKeys,
	};
};

type PublishConfigDiff = {
	appliedKeys: string[];
	skippedKeys: string[];
	removedPublishConfig: boolean;
};

const buildPublishConfigDiff = (
	appliedKeys: string[],
	skippedKeys: string[],
	before: PackageJsonWithExports,
	after: PackageJsonWithExports
): PublishConfigDiff => {
	const removedPublishConfig =
		!!before.publishConfig && !after.publishConfig && appliedKeys.length > 0;

	return {
		appliedKeys,
		skippedKeys,
		removedPublishConfig,
	};
};

const logPublishConfigDiff = (diff: PublishConfigDiff): void => {
	if (
		diff.appliedKeys.length === 0 &&
		diff.skippedKeys.length === 0 &&
		!diff.removedPublishConfig
	) {
		console.debug('No publishConfig to apply.');
		return;
	}

	console.debug('publishConfig application summary:');
	if (diff.appliedKeys.length > 0) {
		console.debug('Applied fields from publishConfig to root:');
		for (const key of diff.appliedKeys) {
			console.debug(`- ${key}`);
		}
	}
	if (diff.skippedKeys.length > 0) {
		console.debug('Skipped npm/pnpm registry metadata fields:');
		for (const key of diff.skippedKeys) {
			console.debug(`- ${key}`);
		}
	}
	if (diff.removedPublishConfig) {
		console.debug('- Removed publishConfig field (all fields applied)');
	} else if (diff.skippedKeys.length > 0) {
		console.debug('- Retained publishConfig with only npm registry metadata');
	}
};

export const applyPackagePublishConfigToFile = async ({
	cwd = process.cwd(),
	packageJsonPath = 'package.json',
	dryRun = false,
}: ApplyPackagePublishConfigOptions = {}): Promise<{
	changed: boolean;
	path: string;
	before: PackageJsonWithExports;
	after: PackageJsonWithExports;
	appliedKeys: string[];
	skippedKeys: string[];
}> => {
	const { resolvedPath, packageJson } = await readPackageJson(
		cwd,
		packageJsonPath
	);

	const {
		packageJson: nextPackageJson,
		appliedKeys,
		skippedKeys,
	} = applyPublishConfig(packageJson);

	const changed =
		JSON.stringify(packageJson) !== JSON.stringify(nextPackageJson);

	if (changed && !dryRun) {
		await writePackageJson(resolvedPath, nextPackageJson);
	}

	return {
		changed,
		path: resolvedPath,
		before: packageJson,
		after: nextPackageJson,
		appliedKeys,
		skippedKeys,
	};
};

export const runApplyPackagePublishConfigCli = async (
	args: string[] = process.argv.slice(2)
): Promise<void> => {
	const { values } = parseArgs({
		args,
		options: {
			cwd: {
				type: 'string',
			},
			packageJson: {
				type: 'string',
				default: 'package.json',
			},
			'package-json': {
				type: 'string',
				default: 'package.json',
			},
			dryRun: {
				type: 'boolean',
				default: false,
			},
			'dry-run': {
				type: 'boolean',
				default: false,
			},
		},
	});

	const packageJsonPath = values.packageJson || values['package-json'];
	const dryRun = values.dryRun || values['dry-run'];

	const { changed, path, before, after, appliedKeys, skippedKeys } =
		await applyPackagePublishConfigToFile({
			cwd: values.cwd,
			packageJsonPath,
			dryRun,
		});
	const diff = buildPublishConfigDiff(appliedKeys, skippedKeys, before, after);

	if (dryRun) {
		console.debug(
			changed
				? `publishConfig would be applied in ${path}.`
				: `No changes to apply in ${path}.`
		);
		logPublishConfigDiff(diff);
		return;
	}

	console.debug(
		changed
			? `Applied publishConfig in ${path}.`
			: `No changes required in ${path}.`
	);
	logPublishConfigDiff(diff);
};

export const runApplyPackagePublishConfigCliWithExitHandling = async (
	args: string[] = process.argv.slice(2)
): Promise<void> => {
	try {
		await runApplyPackagePublishConfigCli(args);
	} catch (error: unknown) {
		console.error(getErrorMessage(error));
		process.exitCode = 1;
	}
};
