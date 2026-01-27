import type { MigrationLogger } from './types';

/**
 * ANSI color codes for console output
 */
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	gray: '\x1b[90m',
} as const;

/**
 * Format metadata for logging
 */
function formatMeta(meta?: Record<string, unknown>): string {
	if (!meta || Object.keys(meta).length === 0) {
		return '';
	}

	try {
		return (
			' ' +
			JSON.stringify(meta, null, 2)
				.split('\n')
				.map((line, i) => (i === 0 ? line : `  ${line}`))
				.join('\n')
		);
	} catch {
		return ' [Object]';
	}
}

/**
 * Get current timestamp string
 */
function getTimestamp(): string {
	return new Date().toISOString();
}

/**
 * Default console logger implementation
 */
export class ConsoleLogger implements MigrationLogger {
	constructor(private useColors = true) {}

	private log(
		level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
		color: string,
		message: string,
		meta?: Record<string, unknown>
	): void {
		const timestamp = this.useColors
			? `${colors.gray}${getTimestamp()}${colors.reset}`
			: getTimestamp();

		const levelStr = this.useColors
			? `${color}${level.padEnd(5)}${colors.reset}`
			: level.padEnd(5);

		const formattedMessage = this.useColors
			? `${colors.bright}${message}${colors.reset}`
			: message;

		const metaStr = formatMeta(meta);

		console.log(`${timestamp} ${levelStr} ${formattedMessage}${metaStr}`);
	}

	info(message: string, meta?: Record<string, unknown>): void {
		this.log('INFO', colors.blue, message, meta);
	}

	warn(message: string, meta?: Record<string, unknown>): void {
		this.log('WARN', colors.yellow, message, meta);
	}

	error(message: string, meta?: Record<string, unknown>): void {
		this.log('ERROR', colors.red, message, meta);
	}

	debug(message: string, meta?: Record<string, unknown>): void {
		this.log('DEBUG', colors.cyan, message, meta);
	}
}

/**
 * Create a default logger instance
 */
export function createDefaultLogger(): MigrationLogger {
	const isColorSupported =
		process.stdout.isTTY &&
		process.env.FORCE_COLOR !== '0' &&
		process.env.NODE_DISABLE_COLORS === undefined;

	return new ConsoleLogger(isColorSupported);
}
