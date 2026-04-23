import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const clientEnv = () =>
	createEnv({
		clientPrefix: 'NEXT_PUBLIC_',
		client: {
			NEXT_PUBLIC_BETTER_AUTH_URL: z.url(),
		},
		runtimeEnv: process.env,
		emptyStringAsUndefined: true,
	});
