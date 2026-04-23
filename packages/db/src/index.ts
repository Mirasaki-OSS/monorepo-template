import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { serverEnv } from './env';
import * as schema from './schema';

type DatabaseSchema = typeof schema;
type Database = NodePgDatabase<DatabaseSchema> & {
	$client: Pool;
};

function createDb(): Database {
	const env = serverEnv();

	return drizzle(env.DATABASE_URL, { schema });
}

const db = createDb();

export { createDb, db };
