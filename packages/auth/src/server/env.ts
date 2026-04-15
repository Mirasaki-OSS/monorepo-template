import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { clientEnv } from '../client/env';

export const serverEnv = () =>
	createEnv({
		extends: [clientEnv()],
		server: {
			BETTER_AUTH_SECRET: z.string().min(32),
			CORS_ORIGIN: z.url(),
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
	});
