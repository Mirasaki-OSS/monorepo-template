import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

export const commonEnv = (): Readonly<{
	NODE_ENV: 'development' | 'production' | 'test';
	NEXT_PUBLIC_APP_NAME: string;
	NEXT_PUBLIC_APP_NAME_SHORT: string;
	NEXT_PUBLIC_APP_DESCRIPTION: string;
	NEXT_PUBLIC_COPYRIGHT_HOLDER: string;
	NEXT_PUBLIC_APP_URL: string;
}> =>
	createEnv({
		server: {
			NODE_ENV: z
				.enum(['development', 'production', 'test'])
				.default('development'),
		},
		client: {
			NEXT_PUBLIC_APP_NAME: z.string().min(1).default('My App'),
			NEXT_PUBLIC_APP_NAME_SHORT: z.string().min(1).default('App'),
			NEXT_PUBLIC_APP_DESCRIPTION: z
				.string()
				.min(1)
				.default('My App Description'),
			NEXT_PUBLIC_COPYRIGHT_HOLDER: z.string().min(1).default('My Company'),
			NEXT_PUBLIC_APP_URL: z.url().min(1),
		},
		runtimeEnv: {
			NODE_ENV: process.env.NODE_ENV || 'development',
			NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
			NEXT_PUBLIC_APP_NAME_SHORT: process.env.NEXT_PUBLIC_APP_NAME_SHORT,
			NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
			NEXT_PUBLIC_COPYRIGHT_HOLDER: process.env.NEXT_PUBLIC_COPYRIGHT_HOLDER,
			NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		},
		shared: {},
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
		isServer: typeof window === 'undefined',
	});
