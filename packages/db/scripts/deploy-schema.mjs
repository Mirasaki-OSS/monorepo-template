import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTargetClient, getDatabaseTarget } from './shared-db.mjs';

try {
	getDatabaseTarget();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error('DATABASE_URL is required for schema deployment:', message);
	process.exit(1);
}

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const migrationsDir = join(packageRoot, 'drizzle');

const hasGeneratedMigrations =
	existsSync(migrationsDir) &&
	readdirSync(migrationsDir, { withFileTypes: true }).some(
		(entry) =>
			entry.isDirectory() &&
			readdirSync(join(migrationsDir, entry.name), {
				withFileTypes: true,
			}).some((file) => file.isFile())
	);

const runDrizzleKit = (command) => {
	const result = spawnSync('pnpm', ['exec', 'drizzle-kit', command], {
		cwd: packageRoot,
		stdio: 'inherit',
		env: process.env,
	});

	if (result.error) {
		throw result.error;
	}

	process.exit(result.status ?? 1);
};

if (hasGeneratedMigrations) {
	console.log('Generated Drizzle migrations found; applying migrations');
	runDrizzleKit('migrate');
}

const client = createTargetClient();

try {
	await client.connect();

	const existingTables = await client.query(`
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.tables
			WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
				AND table_type = 'BASE TABLE'
		)
	`);

	if (existingTables.rows[0]?.exists) {
		console.log(
			'Database schema already initialized; skipping drizzle-kit push'
		);
		process.exit(0);
	}

	console.log(
		'No generated Drizzle migrations found and database is empty; applying schema with drizzle-kit push'
	);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error('Failed to inspect database schema state:', message);
	process.exit(1);
} finally {
	await client.end().catch(() => {});
}

runDrizzleKit('push');
