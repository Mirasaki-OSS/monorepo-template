import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { RecordUtils } from '@md-oss/common/utils';

export type JsonRecord = Record<string, unknown>;

export type PackageJsonWithExports = JsonRecord & {
	exports?: Record<string, unknown>;
	publishConfig?: {
		exports?: Record<string, unknown>;
	} & JsonRecord;
};

export const readPackageJson = async (
	cwd: string,
	packageJsonPath = 'package.json'
): Promise<{ resolvedPath: string; packageJson: PackageJsonWithExports }> => {
	const resolvedPath = path.resolve(cwd, packageJsonPath);
	const packageJson = JSON.parse(
		await readFile(resolvedPath, 'utf8')
	) as PackageJsonWithExports;

	return {
		resolvedPath,
		packageJson,
	};
};

export const writePackageJson = async (
	filePath: string,
	packageJson: PackageJsonWithExports
): Promise<void> => {
	await writeFile(
		filePath,
		`${JSON.stringify(packageJson, null, '\t')}\n`,
		'utf8'
	);
};

export const collectExportTargets = (value: unknown): string[] => {
	if (typeof value === 'string') {
		return [value];
	}

	if (Array.isArray(value)) {
		return value.flatMap((item) => collectExportTargets(item));
	}

	if (RecordUtils.isRecord(value)) {
		return Object.values(value).flatMap((item) => collectExportTargets(item));
	}

	return [];
};
