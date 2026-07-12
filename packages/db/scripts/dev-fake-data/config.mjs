import { randomUUID } from 'node:crypto';
import { getDatabaseTarget } from '../shared-db.mjs';

const DEFAULT_COUNT = 2_000;
const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_ADMIN_COUNT = 3;
const DEFAULT_MODERATOR_COUNT = 25;

function parseInteger(value, flagName) {
	if (!value) {
		throw new Error(`Missing value for ${flagName}`);
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error(`Invalid integer for ${flagName}: ${value}`);
	}

	return parsed;
}

function parseArgs(argv) {
	let hasCustomAdminCount = false;
	let hasCustomModeratorCount = false;

	const options = {
		count: DEFAULT_COUNT,
		batchSize: DEFAULT_BATCH_SIZE,
		seed: Number.parseInt(process.env.FAKER_SEED ?? '', 10),
		truncate: false,
		adminCount: DEFAULT_ADMIN_COUNT,
		moderatorCount: DEFAULT_MODERATOR_COUNT,
		tag: 'dev-seed',
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];

		if (arg === '--') {
			continue;
		}

		if (arg === '--count') {
			options.count = parseInteger(argv[i + 1], '--count');
			i += 1;
			continue;
		}

		if (arg === '--batch-size') {
			options.batchSize = parseInteger(argv[i + 1], '--batch-size');
			i += 1;
			continue;
		}

		if (arg === '--seed') {
			options.seed = parseInteger(argv[i + 1], '--seed');
			i += 1;
			continue;
		}

		if (arg === '--admins') {
			options.adminCount = parseInteger(argv[i + 1], '--admins');
			hasCustomAdminCount = true;
			i += 1;
			continue;
		}

		if (arg === '--moderators') {
			options.moderatorCount = parseInteger(argv[i + 1], '--moderators');
			hasCustomModeratorCount = true;
			i += 1;
			continue;
		}

		if (arg === '--tag') {
			const tag = argv[i + 1]?.trim();
			if (!tag) {
				throw new Error('Missing value for --tag');
			}
			options.tag = tag;
			i += 1;
			continue;
		}

		if (arg === '--truncate') {
			options.truncate = true;
			continue;
		}

		if (arg === '--help') {
			options.help = true;
			continue;
		}

		throw new Error(`Unknown option: ${arg}`);
	}

	if (!Number.isFinite(options.seed)) {
		options.seed = randomUUID()
			.replace(/-/g, '')
			.slice(0, 8)
			.split('')
			.reduce((acc, char) => acc + char.charCodeAt(0), 0);
	}

	if (options.batchSize <= 0) {
		throw new Error('--batch-size must be greater than 0');
	}

	if (options.count <= 0) {
		throw new Error('--count must be greater than 0');
	}

	if (!hasCustomAdminCount) {
		options.adminCount = Math.min(options.adminCount, options.count);
	}

	if (!hasCustomModeratorCount) {
		const remaining = Math.max(options.count - options.adminCount, 0);
		options.moderatorCount = Math.min(options.moderatorCount, remaining);
	}

	if (options.adminCount + options.moderatorCount > options.count) {
		throw new Error(
			'The sum of --admins and --moderators cannot exceed --count'
		);
	}

	return options;
}

function isLikelyDevelopmentDbName(name) {
	return /(local|dev|development|test|staging)/i.test(name);
}

function assertSafeDevMode(dbName) {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('Refusing to generate fake data in production mode');
	}

	if (process.env.CI === 'true') {
		throw new Error('Refusing to generate fake data in CI environment');
	}

	if (
		!isLikelyDevelopmentDbName(dbName) &&
		process.env.ALLOW_FAKE_DATA !== 'true'
	) {
		throw new Error(
			`Refusing to generate fake data for database "${dbName}". Set ALLOW_FAKE_DATA=true to override.`
		);
	}
}

function getSeedConfig(argv = process.argv.slice(2)) {
	const { dbName } = getDatabaseTarget();
	const options = parseArgs(argv);

	if (options.help) {
		return {
			help: true,
			options,
			dbName,
		};
	}

	assertSafeDevMode(dbName);

	return {
		help: false,
		dbName,
		options,
	};
}

export { getSeedConfig };
