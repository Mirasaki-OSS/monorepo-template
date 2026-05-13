import { createTargetClient } from '../shared-db.mjs';
import { getSeedConfig } from './config.mjs';
import { createFakeUsers } from './fake-users.mjs';

function printHelp() {
	console.log(`
Seed large development datasets into the auth user table.

Usage:
  pnpm --filter @md-oss/db db:seed:dev -- --count 10000 --batch-size 1000 --seed 42 --truncate

Options:
  --count <n>         Number of users to generate (default: 2000)
  --batch-size <n>    Insert chunk size (default: 500)
  --seed <n>          Deterministic faker seed
  --admins <n>        Number of admin users at the beginning of the dataset (default: 3)
  --moderators <n>    Number of moderator users after admins (default: 25)
  --tag <value>       Label emitted in logs to identify this run (default: dev-seed)
  --truncate          Remove existing auth rows before seeding
  --help              Show this help message

Safety:
  - Refuses in NODE_ENV=production
  - Refuses in CI
  - Refuses on non-dev-like DB names unless ALLOW_FAKE_DATA=true
`);
}

async function truncateAuthTables(client) {
	await client.query(
		'TRUNCATE TABLE session, account, passkey, "user" CASCADE'
	);
}

function buildInsertStatement(rows, offset = 1) {
	const columns = [
		'id',
		'name',
		'email',
		'email_verified',
		'image',
		'created_at',
		'updated_at',
		'username',
		'display_username',
		'bio',
		'roles',
		'banned',
		'ban_reason',
		'ban_expires_at',
	];

	const values = [];
	const placeholders = rows.map((row, rowIndex) => {
		const base = offset + rowIndex * columns.length;
		values.push(
			row.id,
			row.name,
			row.email,
			row.emailVerified,
			row.image,
			row.createdAt,
			row.updatedAt,
			row.username,
			row.displayUsername,
			row.bio,
			row.roles,
			row.banned,
			row.banReason,
			row.banExpiresAt
		);

		return `(${columns.map((_, idx) => `$${base + idx}`).join(', ')})`;
	});

	const query = `
		INSERT INTO "user" (${columns.join(', ')})
		VALUES ${placeholders.join(',\n')}
		ON CONFLICT (email) DO NOTHING
	`;

	return { query, values };
}

async function insertUsers(client, users, batchSize) {
	let inserted = 0;

	for (let start = 0; start < users.length; start += batchSize) {
		const batch = users.slice(start, start + batchSize);
		const { query, values } = buildInsertStatement(batch);
		const result = await client.query(query, values);
		inserted += result.rowCount ?? 0;
	}

	return inserted;
}

async function run() {
	const config = getSeedConfig();

	if (config.help) {
		printHelp();
		return;
	}

	const { dbName, options } = config;
	const startAt = Date.now();
	const client = createTargetClient();

	const users = createFakeUsers(options);

	console.log(
		`[${options.tag}] Seeding ${users.length} fake users in ${dbName} (seed=${options.seed}, batchSize=${options.batchSize})`
	);

	try {
		await client.connect();

		if (options.truncate) {
			console.log(`[${options.tag}] Truncating auth tables before insert`);
			await truncateAuthTables(client);
		}

		const inserted = await insertUsers(client, users, options.batchSize);
		const elapsedMs = Date.now() - startAt;
		console.log(
			`[${options.tag}] Completed. inserted=${inserted} skipped=${users.length - inserted} durationMs=${elapsedMs}`
		);
	} finally {
		await client.end().catch(() => {});
	}
}

try {
	await run();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error('Failed to seed fake development data:', message);
	process.exit(1);
}
