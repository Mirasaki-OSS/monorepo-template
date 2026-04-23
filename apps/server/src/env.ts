import { serverEnv as apiServerEnv } from '@md-oss/api/env';
import { serverEnv as authServerEnv } from '@md-oss/auth/server/env';
import { serverEnv as databaseServerEnv } from '@md-oss/db/env';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const serverEnv = () =>
	createEnv({
		extends: [apiServerEnv(), authServerEnv(), databaseServerEnv()],
		client: {},
		server: {
			SERVER_PORT: z.number().min(1).max(65535).default(4000),
			CORS_ORIGIN: z.url(),
		},
		runtimeEnv: {
			...process.env,
			SERVER_PORT: process.env.SERVER_PORT
				? Number(process.env.SERVER_PORT)
				: undefined,
		},
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
	});
