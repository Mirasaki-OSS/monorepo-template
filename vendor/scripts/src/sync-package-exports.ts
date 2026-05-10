import { parseArgs } from 'node:util';
import { getErrorMessage } from '@md-oss/common/errors';
import {
	type JsonRecord,
	type PackageJsonWithExports,
	readPackageJson,
	writePackageJson,
} from './package-json';

const SOURCE_CODE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx'];

export type SyncPackageExportsOptions = {
	cwd?: string;
	packageJsonPath?: string;
	dryRun?: boolean;
};

const isRecord = (value: unknown): value is JsonRecord =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const hasSourceCodeExtension = (value: string): boolean =>
	SOURCE_CODE_EXTENSIONS.some((ext) => value.endsWith(ext));

const stripCodeExtension = (value: string): string =>
	value.replace(/\.(ts|tsx|mts|cts|js|jsx)$/u, '');

const srcTargetToPublishExport = (target: string): unknown => {
	if (!target.startsWith('./src/') || !hasSourceCodeExtension(target)) {
		return target;
	}

	const distBase = `./dist/${stripCodeExtension(target.slice('./src/'.length))}`;

	return {
		require: {
			types: `${distBase}.d.cts`,
			default: `${distBase}.cjs`,
		},
		import: {
			types: `${distBase}.d.mts`,
			default: `${distBase}.mjs`,
		},
	};
};

const transformExportValue = (value: unknown): unknown => {
	if (typeof value === 'string') {
		return srcTargetToPublishExport(value);
	}

	if (Array.isArray(value)) {
		return value.map((item) => transformExportValue(item));
	}

	if (isRecord(value)) {
		const nextValue: JsonRecord = {};
		for (const [key, nestedValue] of Object.entries(value)) {
			nextValue[key] = transformExportValue(nestedValue);
		}
		return nextValue;
	}

	return value;
};

const buildPublishConfigExports = (
	exportsField: unknown
): Record<string, unknown> => {
	if (!isRecord(exportsField)) {
		throw new Error('package.json exports must be an object.');
	}

	const nextPublishExports: Record<string, unknown> = {};
	for (const [exportKey, exportValue] of Object.entries(exportsField)) {
		nextPublishExports[exportKey] = transformExportValue(exportValue);
	}

	return nextPublishExports;
};

type ExportDiff = {
	missingKeys: string[];
	extraKeys: string[];
	changedKeys: string[];
	missingComponentKeys: string[];
};

const buildExportDiff = (
	previous: Record<string, unknown>,
	next: Record<string, unknown>
): ExportDiff => {
	const previousKeys = Object.keys(previous).sort();
	const nextKeys = Object.keys(next).sort();

	const previousKeySet = new Set(previousKeys);
	const nextKeySet = new Set(nextKeys);

	const missingKeys = nextKeys.filter((key) => !previousKeySet.has(key));
	const extraKeys = previousKeys.filter((key) => !nextKeySet.has(key));
	const sharedKeys = previousKeys.filter((key) => nextKeySet.has(key));
	const changedKeys = sharedKeys.filter(
		(key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key])
	);

	return {
		missingKeys,
		extraKeys,
		changedKeys,
		missingComponentKeys: missingKeys.filter((key) =>
			key.startsWith('./components/')
		),
	};
};

const logDiffSection = (title: string, entries: string[]): void => {
	if (entries.length === 0) {
		return;
	}

	console.debug(title);
	for (const entry of entries) {
		console.debug(`- ${entry}`);
	}
};

const logPublishConfigExportDiff = (diff: ExportDiff): void => {
	if (
		diff.missingKeys.length === 0 &&
		diff.extraKeys.length === 0 &&
		diff.changedKeys.length === 0
	) {
		console.debug('No export differences found.');
		return;
	}

	console.debug('Export diff summary:');
	logDiffSection(
		'Missing from publishConfig.exports:',
		diff.missingKeys.filter((key) => !diff.missingComponentKeys.includes(key))
	);
	logDiffSection('Extra in publishConfig.exports:', diff.extraKeys);
	logDiffSection('Changed export mappings:', diff.changedKeys);

	logDiffSection(
		'Source components missing from publishConfig:',
		diff.missingComponentKeys.map(
			(key) => `Src component "${key}" is missing from publishConfig`
		)
	);
};

export const syncPackageExports = async ({
	cwd = process.cwd(),
	packageJsonPath = 'package.json',
	dryRun = false,
}: SyncPackageExportsOptions = {}): Promise<{
	changed: boolean;
	path: string;
	previous: Record<string, unknown>;
	next: Record<string, unknown>;
}> => {
	const { resolvedPath, packageJson } = await readPackageJson(
		cwd,
		packageJsonPath
	);

	if (!packageJson.exports) {
		throw new Error('package.json is missing exports.');
	}

	const nextPublishExports = buildPublishConfigExports(packageJson.exports);
	const previousPublishExports = packageJson.publishConfig?.exports ?? {};

	const changed =
		JSON.stringify(previousPublishExports) !==
		JSON.stringify(nextPublishExports);

	if (changed && !dryRun) {
		const nextPackageJson: PackageJsonWithExports = {
			...packageJson,
			publishConfig: {
				...(packageJson.publishConfig ?? {}),
				exports: nextPublishExports,
			},
		};

		await writePackageJson(resolvedPath, nextPackageJson);
	}

	return {
		changed,
		path: resolvedPath,
		previous: previousPublishExports,
		next: nextPublishExports,
	};
};

export const runSyncPackageExportsCli = async (
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

	const { changed, path, previous, next } = await syncPackageExports({
		cwd: values.cwd,
		packageJsonPath,
		dryRun,
	});
	const diff = buildExportDiff(previous, next);

	if (dryRun) {
		console.debug(
			changed
				? `publishConfig.exports is out of sync in ${path}.`
				: `publishConfig.exports is already in sync in ${path}.`
		);
		logPublishConfigExportDiff(diff);
		return;
	}

	console.debug(
		changed
			? `Synced publishConfig.exports in ${path}.`
			: `No changes required for publishConfig.exports in ${path}.`
	);
	logPublishConfigExportDiff(diff);
};

export const runSyncPackageExportsCliWithExitHandling = async (
	args: string[] = process.argv.slice(2)
): Promise<void> => {
	try {
		await runSyncPackageExportsCli(args);
	} catch (error: unknown) {
		console.error(getErrorMessage(error));
		process.exitCode = 1;
	}
};
