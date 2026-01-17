import { getGreeting } from '@repo/utils';

const VERSION = '1.0.0';

interface CliOptions {
	name: string;
	version: boolean;
	help: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CliOptions {
	return {
		name: args.find((arg) => !arg.startsWith('-')) || 'World',
		version: args.includes('--version') || args.includes('-v'),
		help: args.includes('--help') || args.includes('-h'),
	};
}

/**
 * Display help message
 */
function showHelp(): void {
	console.log(`
CLI Tool v${VERSION}

Usage:
  cli [options] [name]

Arguments:
  name                The name to greet (default: "World")

Options:
  -h, --help         Show this help message
  -v, --version      Show version number

Examples:
  cli
  cli Alice
  cli --help
  cli --version
`);
}

/**
 * Display version
 */
function showVersion(): void {
	console.log(`v${VERSION}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	try {
		if (options.help) {
			showHelp();
			process.exit(0);
		}

		if (options.version) {
			showVersion();
			process.exit(0);
		}

		const greeting = getGreeting(options.name);
		console.log(greeting);
		process.exit(0);
	} catch (error) {
		console.error(
			'Error:',
			error instanceof Error ? error.message : 'Unknown error'
		);
		process.exit(1);
	}
}

main();
