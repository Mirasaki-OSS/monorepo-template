import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

export const env = (): Readonly<{
	REDIS_URL: string;
}> =>
	createEnv({
		server: {
			REDIS_URL: z.url().default('redis://localhost:6379'),
		},
		client: {},
		runtimeEnv: process.env,
		clientPrefix: 'NEXT_PUBLIC_',
		emptyStringAsUndefined: true,
	});
