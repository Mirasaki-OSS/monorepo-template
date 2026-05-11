import {
	createAdminClient,
	ensureDatabase,
	escapeIdent,
	getDatabaseTarget,
} from './shared-db.mjs';

const resetDatabase = async () => {
	const { dbName, adminDb } = getDatabaseTarget();

	if (dbName === adminDb) {
		throw new Error(
			`Refusing to reset database "${dbName}" because it matches POSTGRES_ADMIN_DB`
		);
	}

	const client = createAdminClient();

	try {
		await client.connect();

		await client.query(
			`SELECT pg_terminate_backend(pid)
			 FROM pg_stat_activity
			 WHERE datname = $1
			   AND pid <> pg_backend_pid()`,
			[dbName]
		);

		await client.query(`DROP DATABASE IF EXISTS ${escapeIdent(dbName)}`);
		console.log(`Dropped database: ${dbName}`);
	} finally {
		await client.end().catch(() => {});
	}

	await ensureDatabase();
};

try {
	await resetDatabase();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error('Failed to reset database:', message);
	process.exit(1);
}
