import { createEnv } from '@t3-oss/env-core';

export const clientEnv = () =>
	createEnv({
		extends: [],
		client: {},
		server: {},
		runtimeEnv: {},
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
	});

export type ClientEnv = ReturnType<typeof clientEnv>;

export const serverEnv = () =>
	createEnv({
		extends: [clientEnv()],
		client: {},
		server: {},
		runtimeEnv: {},
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
	});

export type ServerEnv = ReturnType<typeof serverEnv>;
