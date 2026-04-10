import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

export type AddModuleDirectivesOptions = {
	cwd?: string;
	directive: string;
	files: string[];
};

const normalizeDirective = (directive: string): string => {
	const trimmed = directive.trim();
	const unquoted = trimmed.replace(/^['"]|['"]$/g, '');
	return `'${unquoted}';\n`;
};

export const addModuleDirectivesToFiles = async ({
	cwd = process.cwd(),
	directive,
	files,
}: AddModuleDirectivesOptions): Promise<void> => {
	if (files.length === 0) {
		throw new Error('At least one file path is required.');
	}

	if (directive.trim().length === 0) {
		throw new Error('A non-empty directive is required.');
	}

	const normalizedDirective = normalizeDirective(directive);

	for (const file of files) {
		const absolutePath = path.resolve(cwd, file);
		const content = await readFile(absolutePath, 'utf8');

		if (
			content.startsWith(normalizedDirective) ||
			content.startsWith('"use client";\n') ||
			content.startsWith('"use server";\n') ||
			content.startsWith("'use server';\n")
		) {
			continue;
		}

		await writeFile(absolutePath, `${normalizedDirective}${content}`, 'utf8');
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
		},
		allowPositionals: true,
	});

	if (!values.directive) {
		throw new Error('Missing required --directive option.');
	}

	await addModuleDirectivesToFiles({
		cwd: values.cwd,
		directive: values.directive,
		files: positionals,
	});
};
