import { clientEnv as authClientEnv } from '@md-oss/auth/client/env';
import { serverEnv as authServerEnv } from '@md-oss/auth/server/env';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const clientEnv = () =>
	createEnv({
		extends: [authClientEnv()],
		client: {},
		server: {},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
	});

export const serverEnv = () =>
	createEnv({
		extends: [authServerEnv()],
		client: {},
		server: {
			BETTER_AUTH_SECRET: z.string().min(32),
			CORS_ORIGIN: z.url(),
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
	});
