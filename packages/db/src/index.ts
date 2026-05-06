import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { serverEnv } from './env';
import { relations } from './schema';

type DatabaseRelations = typeof relations;
type Database = NodePgDatabase<DatabaseRelations> & {
	$client: Pool;
};

function createDb(): Database {
	const env = serverEnv();

	return drizzle(env.DATABASE_URL, { relations });
}

const db = createDb();

export * from 'drizzle-orm';
export { createDb, db };
