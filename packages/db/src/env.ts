import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const serverEnv = () =>
	createEnv({
		client: {},
		server: {
			DATABASE_URL: z.string().min(1),
		},
		runtimeEnv: process.env,
		clientPrefix: 'NEXT_PUBLIC_',
		emptyStringAsUndefined: true,
	});
