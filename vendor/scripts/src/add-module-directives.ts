import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { RecordUtils } from '@md-oss/common/utils';

export type AddModuleDirectivesOptions = {
	cwd?: string;
	directive: string;
	files: string[];
	extensions?: string[];
};

export type AddModuleDirectivesFromPackageExportsOptions = {
	cwd?: string;
	packageJsonPath?: string;
	extensions?: string[];
};

type PackageJsonWithExports = {
	exports?: Record<string, unknown>;
};

const DEFAULT_EXTENSIONS = ['mjs', 'cjs'];
const SOURCE_FILE_EXTENSIONS = ['ts', 'tsx', 'mts', 'cts', 'js', 'jsx'];

const normalizeDirective = (directive: string): string => {
	const trimmed = directive.trim();
	const unquoted = trimmed.replace(/^['"]|['"]$/g, '');
	return `'${unquoted}';\n`;
};

const isFileWithExtension = (file: string) => path.extname(file) !== '';

const fileExtensionFilter = (file: string, extensions: string[]) => {
	if (extensions.length === 0) {
		return true;
	}

	const ext = path.extname(file).slice(1);
	return extensions.includes(ext);
};

const buildFileExtensionParticipants = (file: string, extensions: string[]) => {
	if (isFileWithExtension(file)) {
		return [file];
	}

	return extensions.map((ext) => `${file}.${ext}`);
};

const expandFiles = (cwd: string, files: string[], extensions: string[]) => {
	const expandedFiles = new Set<string>();

	for (const file of files) {
		if (extensions.length > 0) {
			if (!isFileWithExtension(file)) {
				for (const participant of buildFileExtensionParticipants(
					file,
					extensions
				)) {
					expandedFiles.add(path.resolve(cwd, participant));
				}
			} else if (fileExtensionFilter(file, extensions)) {
				expandedFiles.add(path.resolve(cwd, file));
			}
		} else {
			expandedFiles.add(path.resolve(cwd, file));
		}
	}

	return [...expandedFiles];
};

const stripLeadingTrivia = (value: string): string => {
	let remaining = value.replace(/^\uFEFF/, '');

	while (true) {
		const withoutWhitespace = remaining.replace(/^\s+/, '');

		if (withoutWhitespace.startsWith('//')) {
			const newlineIndex = withoutWhitespace.indexOf('\n');
			remaining =
				newlineIndex === -1 ? '' : withoutWhitespace.slice(newlineIndex + 1);
			continue;
		}

		if (withoutWhitespace.startsWith('/*')) {
			const commentEndIndex = withoutWhitespace.indexOf('*/');
			remaining =
				commentEndIndex === -1
					? ''
					: withoutWhitespace.slice(commentEndIndex + 2);
			continue;
		}

		return withoutWhitespace;
	}
};

const extractLeadingDirectives = (content: string): string[] => {
	const directives: string[] = [];
	let remaining = stripLeadingTrivia(content);

	while (true) {
		const match = remaining.match(/^(['"])([^'"\n\r]+)\1;?/);
		if (!match) {
			break;
		}

		const target = match[2];

		if (typeof target === 'undefined' || target.trim() === '') {
			break;
		}

		directives.push(target.trim());
		remaining = stripLeadingTrivia(remaining.slice(match[0].length));
	}

	return directives;
};

const addNormalizedDirectivesToFiles = async ({
	cwd = process.cwd(),
	directives,
	files,
	extensions = DEFAULT_EXTENSIONS,
}: {
	cwd?: string;
	directives: string[];
	files: string[];
	extensions?: string[];
}): Promise<void> => {
	if (files.length === 0 || directives.length === 0) {
		return;
	}

	const normalizedDirectives = [...new Set(directives.map(normalizeDirective))];
	const expandedFiles = expandFiles(cwd, files, extensions);

	for (const absolutePath of expandedFiles) {
		const content = await readFile(absolutePath, 'utf8');
		const existingDirectives = new Set(
			extractLeadingDirectives(content).map(normalizeDirective)
		);
		const missingDirectives = normalizedDirectives.filter(
			(directive) => !existingDirectives.has(directive)
		);

		if (missingDirectives.length === 0) {
			continue;
		}

		await writeFile(
			absolutePath,
			`${missingDirectives.join('')}${content}`,
			'utf8'
		);
	}
};

export const addModuleDirectivesToFiles = async ({
	cwd = process.cwd(),
	directive,
	files,
	extensions = DEFAULT_EXTENSIONS,
}: AddModuleDirectivesOptions): Promise<void> => {
	if (files.length === 0) {
		throw new Error('At least one file path is required.');
	}

	if (directive.trim().length === 0) {
		throw new Error('A non-empty directive is required.');
	}

	await addNormalizedDirectivesToFiles({
		cwd,
		directives: [directive],
		files,
		extensions,
	});
};

const collectExportTargets = (value: unknown): string[] => {
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

const fileExists = async (filePath: string): Promise<boolean> => {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
};

const resolveSourceFileFromDistTarget = async (
	cwd: string,
	distTarget: string
): Promise<string | undefined> => {
	const normalizedTarget = distTarget.replace(/^\.\//, '').replace(/\\/g, '/');
	if (!normalizedTarget.startsWith('dist/')) {
		return undefined;
	}

	const relativeDistPath = normalizedTarget
		.slice('dist/'.length)
		.replace(/\.(mjs|cjs|js)$/, '');

	const variants = new Set<string>([relativeDistPath]);
	if (relativeDistPath.endsWith('/index')) {
		variants.add(relativeDistPath.slice(0, -'/index'.length));
	}

	const candidates: string[] = [];
	for (const variant of variants) {
		for (const extension of SOURCE_FILE_EXTENSIONS) {
			candidates.push(path.resolve(cwd, 'src', `${variant}.${extension}`));
		}

		if (!variant.endsWith('/index')) {
			for (const extension of SOURCE_FILE_EXTENSIONS) {
				candidates.push(
					path.resolve(cwd, 'src', variant, `index.${extension}`)
				);
			}
		}
	}

	for (const candidate of candidates) {
		if (await fileExists(candidate)) {
			return candidate;
		}
	}

	return undefined;
};

export const addModuleDirectivesFromPackageExports = async ({
	cwd = process.cwd(),
	packageJsonPath = 'package.json',
	extensions = DEFAULT_EXTENSIONS,
}: AddModuleDirectivesFromPackageExportsOptions = {}): Promise<void> => {
	const resolvedPackageJsonPath = path.resolve(cwd, packageJsonPath);
	const packageJson = JSON.parse(
		await readFile(resolvedPackageJsonPath, 'utf8')
	) as PackageJsonWithExports;

	const exportTargets = [
		...new Set(collectExportTargets(packageJson.exports)),
	].filter(
		(target) =>
			target.startsWith('./dist/') && fileExtensionFilter(target, extensions)
	);

	for (const exportTarget of exportTargets) {
		const sourceFile = await resolveSourceFileFromDistTarget(cwd, exportTarget);
		if (!sourceFile) {
			continue;
		}

		const sourceContent = await readFile(sourceFile, 'utf8');
		const directives = extractLeadingDirectives(sourceContent);

		if (directives.length === 0) {
			continue;
		}

		await addNormalizedDirectivesToFiles({
			cwd,
			directives,
			files: [exportTarget],
			extensions,
		});
	}
};

export const runAddModuleDirectivesCli = async (
	args: string[] = process.argv.slice(2)
): Promise<void> => {
	const { values, positionals } = parseArgs({
		args,
		options: {
			cwd: {
				type: 'string',
			},
			directive: {
				type: 'string',
			},
			extensions: {
				type: 'string',
				default: DEFAULT_EXTENSIONS.join(','),
			},
			fromPackageExports: {
				type: 'boolean',
				default: false,
			},
			'from-package-exports': {
				type: 'boolean',
				default: false,
			},
			packageJson: {
				type: 'string',
				default: 'package.json',
			},
			'package-json': {
				type: 'string',
				default: 'package.json',
			},
		},
		allowPositionals: true,
	});

	const extensions = values.extensions
		.split(',')
		.map((ext) => ext.trim().replace(/^\./, ''))
		.filter(Boolean);
	const usePackageExports =
		values.fromPackageExports || values['from-package-exports'];
	const packageJsonPath = values.packageJson || values['package-json'];

	if (usePackageExports) {
		await addModuleDirectivesFromPackageExports({
			cwd: values.cwd,
			packageJsonPath,
			extensions,
		});
	}

	if (positionals.length > 0) {
		if (!values.directive) {
			throw new Error(
				'Missing required --directive option for manual file targets.'
			);
		}

		await addModuleDirectivesToFiles({
			cwd: values.cwd,
			directive: values.directive,
			files: positionals,
			extensions,
		});
		return;
	}

	if (!usePackageExports) {
		throw new Error(
			'Missing targets. Provide file paths or use --from-package-exports.'
		);
	}
};
