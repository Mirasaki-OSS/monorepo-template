import { serverEnv as apiServerEnv } from '@md-oss/api/env';
import { serverEnv as authServerEnv } from '@md-oss/auth/server/env';
import { serverEnv as databaseServerEnv } from '@md-oss/db/env';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const parsedEnv = createEnv({
	extends: [apiServerEnv(), authServerEnv(), databaseServerEnv()],
	client: {},
	server: {
		SERVER_PORT: z.number().min(1).max(65535).default(4000),
		CORS_ORIGIN: z.url(),
		RATE_LIMIT_ENABLED: z.boolean().default(true),
		RATE_LIMIT_GLOBAL_MAX: z.number().int().positive().default(240),
		RATE_LIMIT_GLOBAL_WINDOW_SECONDS: z.number().int().positive().default(60),
		RATE_LIMIT_AUTH_MAX: z.number().int().positive().default(20),
		RATE_LIMIT_AUTH_WINDOW_SECONDS: z.number().int().positive().default(60),
		RATE_LIMIT_TRPC_QUERY_MAX: z.number().int().positive().default(180),
		RATE_LIMIT_TRPC_QUERY_WINDOW_SECONDS: z
			.number()
			.int()
			.positive()
			.default(60),
		RATE_LIMIT_TRPC_MUTATION_MAX: z.number().int().positive().default(60),
		RATE_LIMIT_TRPC_MUTATION_WINDOW_SECONDS: z
			.number()
			.int()
			.positive()
			.default(60),
	},
	runtimeEnv: {
		...process.env,
		SERVER_PORT: process.env.SERVER_PORT
			? Number(process.env.SERVER_PORT)
			: undefined,
		RATE_LIMIT_ENABLED:
			process.env.RATE_LIMIT_ENABLED === undefined
				? undefined
				: process.env.RATE_LIMIT_ENABLED === 'true',
		RATE_LIMIT_GLOBAL_MAX: process.env.RATE_LIMIT_GLOBAL_MAX
			? Number(process.env.RATE_LIMIT_GLOBAL_MAX)
			: undefined,
		RATE_LIMIT_GLOBAL_WINDOW_SECONDS: process.env
			.RATE_LIMIT_GLOBAL_WINDOW_SECONDS
			? Number(process.env.RATE_LIMIT_GLOBAL_WINDOW_SECONDS)
			: undefined,
		RATE_LIMIT_AUTH_MAX: process.env.RATE_LIMIT_AUTH_MAX
			? Number(process.env.RATE_LIMIT_AUTH_MAX)
			: undefined,
		RATE_LIMIT_AUTH_WINDOW_SECONDS: process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS
			? Number(process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS)
			: undefined,
		RATE_LIMIT_TRPC_QUERY_MAX: process.env.RATE_LIMIT_TRPC_QUERY_MAX
			? Number(process.env.RATE_LIMIT_TRPC_QUERY_MAX)
			: undefined,
		RATE_LIMIT_TRPC_QUERY_WINDOW_SECONDS: process.env
			.RATE_LIMIT_TRPC_QUERY_WINDOW_SECONDS
			? Number(process.env.RATE_LIMIT_TRPC_QUERY_WINDOW_SECONDS)
			: undefined,
		RATE_LIMIT_TRPC_MUTATION_MAX: process.env.RATE_LIMIT_TRPC_MUTATION_MAX
			? Number(process.env.RATE_LIMIT_TRPC_MUTATION_MAX)
			: undefined,
		RATE_LIMIT_TRPC_MUTATION_WINDOW_SECONDS: process.env
			.RATE_LIMIT_TRPC_MUTATION_WINDOW_SECONDS
			? Number(process.env.RATE_LIMIT_TRPC_MUTATION_WINDOW_SECONDS)
			: undefined,
	},
	emptyStringAsUndefined: true,
	clientPrefix: 'NEXT_PUBLIC_',
});
