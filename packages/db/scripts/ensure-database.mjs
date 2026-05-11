import { ensureDatabase } from './shared-db.mjs';

const run = async () => {
	try {
		await ensureDatabase();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(
			'Failed to ensure database exists. Verify credentials and CREATEDB permission:',
			message
		);
		process.exit(1);
	}
};

await run();
