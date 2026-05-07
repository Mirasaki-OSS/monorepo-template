import { defineConfig } from 'drizzle-kit';
import { serverEnv } from './src/env';

const env = serverEnv();

export default defineConfig({
	schema: './src/schema',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
