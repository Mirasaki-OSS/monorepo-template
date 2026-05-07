import pg from 'pg';

const { Client } = pg;

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
	console.error('DATABASE_URL is required for migrations');
	process.exit(1);
}

const targetUrl = new URL(rawUrl);
const dbName = decodeURIComponent(targetUrl.pathname.replace(/^\//, ''));
if (!dbName) {
	console.error('DATABASE_URL must include a database name in the path');
	process.exit(1);
}

const adminDb = process.env.POSTGRES_ADMIN_DB || 'postgres';
const adminUrl = new URL(rawUrl);
adminUrl.pathname = `/${encodeURIComponent(adminDb)}`;

const escapeIdent = (name) => `"${name.replace(/"/g, '""')}"`;

const client = new Client({ connectionString: adminUrl.toString() });

try {
	await client.connect();

	const exists = await client.query(
		'SELECT 1 FROM pg_database WHERE datname = $1',
		[dbName]
	);

	if (exists.rowCount > 0) {
		console.log(`Database already exists: ${dbName}`);
		process.exit(0);
	}

	await client.query(`CREATE DATABASE ${escapeIdent(dbName)}`);
	console.log(`Created database: ${dbName}`);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(
		'Failed to ensure database exists. Verify credentials and CREATEDB permission:',
		message
	);
	process.exit(1);
} finally {
	await client.end().catch(() => {});
}
