import pg from 'pg';

const { Client } = pg;

export const getDatabaseTarget = () => {
	const rawUrl = process.env.DATABASE_URL;
	if (!rawUrl) {
		throw new Error('DATABASE_URL is required for database scripts');
	}

	const targetUrl = new URL(rawUrl);
	const dbName = decodeURIComponent(targetUrl.pathname.replace(/^\//, ''));
	if (!dbName) {
		throw new Error('DATABASE_URL must include a database name in the path');
	}

	const adminDb = process.env.POSTGRES_ADMIN_DB || 'postgres';
	const adminUrl = new URL(rawUrl);
	adminUrl.pathname = `/${encodeURIComponent(adminDb)}`;

	return {
		dbName,
		adminDb,
		rawUrl,
		adminConnectionString: adminUrl.toString(),
	};
};

export const createAdminClient = () => {
	const { adminConnectionString } = getDatabaseTarget();
	return new Client({ connectionString: adminConnectionString });
};

export const createTargetClient = () => {
	const { rawUrl } = getDatabaseTarget();
	return new Client({ connectionString: rawUrl });
};

export const escapeIdent = (name) => `"${name.replace(/"/g, '""')}"`;

export const ensureDatabase = async () => {
	const { dbName } = getDatabaseTarget();
	const client = createAdminClient();

	try {
		await client.connect();

		const exists = await client.query(
			'SELECT 1 FROM pg_database WHERE datname = $1',
			[dbName]
		);

		if (exists.rowCount > 0) {
			console.log(`Database already exists: ${dbName}`);
			return false;
		}

		await client.query(`CREATE DATABASE ${escapeIdent(dbName)}`);
		console.log(`Created database: ${dbName}`);
		return true;
	} finally {
		await client.end().catch(() => {});
	}
};
