import { readdirSync, statSync } from 'node:fs';
import {
	basename,
	dirname,
	extname,
	join,
	parse as pathParse,
	relative,
	resolve,
} from 'node:path';
import { ByteMagic } from '../constants';

/**
 * Regular expression pattern for parsing byte strings
 *
 * Matches strings in the format: `<number> <unit>` where:
 * - `<number>` is an integer or decimal number
 * - `<unit>` is an optional unit (b, kb, mb, gb, tb, pb, eb, zb, yb)
 *
 * @example
 * ```ts
 * '1024'.match(BYTE_STRING_PATTERN) // ['1024', '1024', undefined]
 * '1.5 MB'.match(BYTE_STRING_PATTERN) // ['1.5 MB', '1.5', 'MB']
 * '100 KB'.match(BYTE_STRING_PATTERN) // ['100 KB', '100', 'KB']
 * '2.5gb'.match(BYTE_STRING_PATTERN) // ['2.5gb', '2.5', 'gb']
 * '500'.match(BYTE_STRING_PATTERN) // ['500', '500', undefined]
 * ```
 */
const BYTE_STRING_PATTERN = /^(\d+(?:\.\d+)?)\s*([a-z]+)?$/i;

/**
 * Format bytes to human readable format
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';
	if (bytes < 0) return `-${formatBytes(-bytes, decimals)}`;

	const k = ByteMagic.BYTES_PER_KILOBYTE;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Parse bytes from human readable format
 * @param value - String value (e.g., "1.5 MB")
 * @returns Number of bytes
 */
function parseBytes(value: string): number {
	const units: Record<string, number> = {
		b: ByteMagic.BYTE,
		bytes: ByteMagic.BYTE,
		kb: ByteMagic.KILOBYTE,
		mb: ByteMagic.MEGABYTE,
		gb: ByteMagic.GIGABYTE,
		tb: ByteMagic.TERABYTE,
		pb: ByteMagic.PETABYTE,
		eb: ByteMagic.EXABYTE,
		zb: ByteMagic.ZETTABYTE,
		yb: ByteMagic.YOTTABYTE,
	};

	const match = value.trim().match(BYTE_STRING_PATTERN);
	if (!match) throw new Error(`Invalid byte string: ${value}`);

	const [, num, unit = 'b'] = match;
	const multiplier = units[unit.toLowerCase()];

	if (!multiplier) throw new Error(`Unknown unit: ${unit}`);

	return Math.floor(Number.parseFloat(num) * multiplier);
}

interface GetFilesOptions {
	/**
	 * File extensions to include (e.g., ['.ts', '.js'])
	 * If not provided, all files are included
	 */
	extensions?: string[];

	/**
	 * Whether to include dotfiles (default: false)
	 */
	includeDotFiles?: boolean;

	/**
	 * Whether to search recursively (default: true)
	 */
	recursive?: boolean;

	/**
	 * Maximum depth for recursive search (default: Infinity)
	 */
	maxDepth?: number;

	/**
	 * Directories to exclude from search
	 */
	excludeDirs?: string[];

	/**
	 * Pattern to match file names (regex or string)
	 */
	pattern?: string | RegExp;

	/**
	 * Whether to return absolute paths (default: false)
	 */
	absolutePaths?: boolean;

	/**
	 * Custom filter function
	 */
	filter?: (filePath: string, stats: ReturnType<typeof statSync>) => boolean;
}

/**
 * Get files from a directory with various filtering options
 * @param dirPath - Directory path to search
 * @param options - Options for filtering files
 * @returns Array of file paths
 */
function getFiles(dirPath: string, options: GetFilesOptions = {}): string[] {
	const {
		extensions,
		includeDotFiles = false,
		recursive = true,
		maxDepth = Number.POSITIVE_INFINITY,
		excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'],
		pattern,
		absolutePaths = false,
		filter,
	} = options;

	const results: string[] = [];
	const basePath = resolve(dirPath);

	function traverse(currentPath: string, depth = 0): void {
		if (depth > maxDepth) return;

		try {
			const entries = readdirSync(currentPath, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(currentPath, entry.name);

				// Skip dotfiles if not included
				if (!includeDotFiles && entry.name.startsWith('.')) {
					continue;
				}

				if (entry.isDirectory()) {
					// Skip excluded directories
					if (excludeDirs.includes(entry.name)) {
						continue;
					}

					// Recurse into subdirectories
					if (recursive) {
						traverse(fullPath, depth + 1);
					}
				} else if (entry.isFile()) {
					const stats = statSync(fullPath);

					// Apply extension filter
					if (extensions) {
						const ext = extname(entry.name);
						if (!extensions.includes(ext)) {
							continue;
						}
					}

					// Apply pattern filter
					if (pattern) {
						const regex =
							typeof pattern === 'string' ? new RegExp(pattern) : pattern;
						if (!regex.test(entry.name)) {
							continue;
						}
					}

					// Apply custom filter
					if (filter && !filter(fullPath, stats)) {
						continue;
					}

					const resultPath = absolutePaths
						? fullPath
						: relative(basePath, fullPath);
					results.push(resultPath);
				}
			}
		} catch (error) {
			// Skip directories we don't have permission to read
			console.error(`Error reading directory ${currentPath}:`, error);
		}
	}

	traverse(dirPath);
	return results;
}

/**
 * Get file extension including the dot (e.g., ".ts")
 * @param filePath - File path
 * @returns File extension
 */
function getExtension(filePath: string): string {
	return extname(filePath);
}

/**
 * Get file name without parent directories, optionally including the extension
 * @param filePath - File path
 * @param includeExtension - Whether to include the file extension (default: true)
 * @returns File name without directories (e.g., "index.ts" or "index" if includeExtension is false)
 */
function getBaseName(filePath: string, includeExtension = true): string {
	return includeExtension
		? basename(filePath)
		: basename(filePath, extname(filePath));
}

/**
 * Get directory name from file path
 * @param filePath - File path
 * @returns Directory name
 */
function getDirName(filePath: string): string {
	return dirname(filePath);
}

/**
 * Parse file path into components
 * @param filePath - File path
 * @returns Parsed path object
 */
function parseFilePath(filePath: string) {
	const parsed = pathParse(filePath);
	return {
		root: parsed.root,
		dir: parsed.dir,
		base: parsed.base,
		ext: parsed.ext,
		name: parsed.name,
	};
}

/**
 * Get file size in bytes
 * @param filePath - File path
 * @returns File size in bytes
 */
function getFileSize(filePath: string): number {
	try {
		return statSync(filePath).size;
	} catch {
		return 0;
	}
}

/**
 * Get human readable file size
 * @param filePath - File path
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size
 */
function getFileSizeFormatted(filePath: string, decimals = 2): string {
	return formatBytes(getFileSize(filePath), decimals);
}

/**
 * Check if path is a directory
 * @param path - Path to check
 * @returns True if path is a directory
 */
function isDirectory(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}

/**
 * Check if path is a file
 * @param path - Path to check
 * @returns True if path is a file
 */
function isFile(path: string): boolean {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}

/**
 * Check if file is a dotfile
 * @param filePath - File path
 * @returns True if file is a dotfile
 */
function isDotFile(filePath: string): boolean {
	const fileName = basename(filePath);
	return fileName.startsWith('.');
}

/**
 * Normalize file extension (ensure it starts with a dot)
 * @param ext - File extension
 * @returns Normalized extension
 */
function normalizeExtension(ext: string): string {
	return ext.startsWith('.') ? ext : `.${ext}`;
}

/**
 * Check if file has specific extension
 * @param filePath - File path
 * @param extensions - Extension or array of extensions to check
 * @returns True if file has one of the extensions
 */
function hasExtension(
	filePath: string,
	extensions: string | string[]
): boolean {
	const fileExt = extname(filePath).toLowerCase();
	const exts = Array.isArray(extensions) ? extensions : [extensions];

	return exts.some((ext) => normalizeExtension(ext).toLowerCase() === fileExt);
}

/**
 * Group files by extension
 * @param filePaths - Array of file paths
 * @returns Object with extensions as keys and file paths as values
 */
function groupByExtension(filePaths: string[]): Record<string, string[]> {
	return filePaths.reduce(
		(acc, filePath) => {
			const ext = extname(filePath) || 'no-extension';
			if (!acc[ext]) {
				acc[ext] = [];
			}
			acc[ext].push(filePath);
			return acc;
		},
		{} as Record<string, string[]>
	);
}

export {
	BYTE_STRING_PATTERN,
	formatBytes,
	parseBytes,
	getFiles,
	getExtension,
	getBaseName,
	getDirName,
	parseFilePath,
	getFileSize,
	getFileSizeFormatted,
	isDirectory,
	isFile,
	isDotFile,
	normalizeExtension,
	hasExtension,
	groupByExtension,
	type GetFilesOptions,
};
