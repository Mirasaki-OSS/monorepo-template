import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = (): Readonly<{
	LOG_DIR?: string | undefined;
	NODE_ENV: 'development' | 'production' | 'test';
	LOG_LEVEL: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
	LOG_TO_CONSOLE: boolean;
}> =>
	createEnv({
		server: {
			NODE_ENV: z
				.enum(['development', 'production', 'test'])
				.default('development'),
			LOG_LEVEL: z
				.enum(['error', 'warn', 'info', 'verbose', 'debug', 'silly'])
				.default('info'),
			LOG_DIR: z.string().optional(),
			LOG_TO_CONSOLE: z.boolean().default(true),
		},
		client: {},
		runtimeEnv: {
			NODE_ENV: process.env.NODE_ENV || 'development',
			LOG_LEVEL: process.env.LOG_LEVEL || 'info',
			LOG_DIR: process.env.LOG_DIR,
			LOG_TO_CONSOLE: process.env.LOG_TO_CONSOLE !== 'false',
		},
	});
