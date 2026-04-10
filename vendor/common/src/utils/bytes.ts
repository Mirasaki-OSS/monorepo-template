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

export { BYTE_STRING_PATTERN, formatBytes, parseBytes };
