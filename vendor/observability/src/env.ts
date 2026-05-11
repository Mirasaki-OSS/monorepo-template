import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = (): Readonly<{
	LOG_DIR?: string | undefined;
	LOG_LEVEL: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
	LOG_TO_CONSOLE: boolean;
}> =>
	createEnv({
		server: {
			LOG_DIR: z.string().optional(),
			LOG_TO_CONSOLE: z.boolean().default(true),
			LOG_LEVEL: z
				.enum(['error', 'warn', 'info', 'verbose', 'debug', 'silly'])
				.default('info'),
		},
		client: {},
		runtimeEnv: {
			LOG_DIR: process.env.LOG_DIR,
			LOG_LEVEL: process.env.LOG_LEVEL || 'info',
			LOG_TO_CONSOLE: process.env.LOG_TO_CONSOLE !== 'false',
		},
		emptyStringAsUndefined: true,
	});
