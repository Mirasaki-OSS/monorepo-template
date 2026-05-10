import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

export const commonEnv = (): Readonly<{
	NODE_ENV: 'development' | 'production' | 'test';
}> =>
	createEnv({
		server: {},
		client: {},
		runtimeEnv: {
			NODE_ENV: process.env.NODE_ENV || 'development',
		},
		shared: {
			NODE_ENV: z
				.enum(['development', 'production', 'test'])
				.default('development'),
		},
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
		isServer: typeof window === 'undefined',
	});
