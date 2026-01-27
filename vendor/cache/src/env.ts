import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

export const env = (): Readonly<{
	REDIS_URL: string;
}> =>
	createEnv({
		server: {
			REDIS_URL: z.string().url().default('redis://localhost:6379'),
		},
		client: {},
		runtimeEnv: {
			REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
		},
	});
