import { clientEnv as authClientEnv } from '@md-oss/auth/client/env';
import { serverEnv as authServerEnv } from '@md-oss/auth/server/env';
import { commonEnv } from '@md-oss/common/env';
import { serverEnv as emailServerEnv } from '@md-oss/email/env';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const clientEnv = () =>
	createEnv({
		extends: [authClientEnv()],
		client: {
			NEXT_PUBLIC_APP_NAME: z.string().min(1).default('My App'),
			NEXT_PUBLIC_APP_URL: z.url().min(1),
			NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
		},
		server: {},
		runtimeEnv: {
			NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
			NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
			NEXT_PUBLIC_TURNSTILE_SITE_KEY:
				process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
		},
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
	});

export type ClientEnv = ReturnType<typeof clientEnv>;

export const serverEnv = () =>
	createEnv({
		extends: [authServerEnv(), commonEnv(), clientEnv(), emailServerEnv()],
		client: {},
		server: {
			BETTER_AUTH_SECRET: z.string().min(32),
			CORS_ORIGIN: z.url(),
			COOKIE_DOMAIN: z
				.string()
				.regex(
					/^(?:\.?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)$/,
					'COOKIE_DOMAIN must be a host/domain only (no protocol, path, or port)'
				)
				.optional(),
			CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().optional(),
			// Start Social Providers
			DISCORD_CLIENT_ID: z.string().optional(),
			DISCORD_CLIENT_SECRET: z.string().optional(),
			GOOGLE_CLIENT_ID: z.string().optional(),
			GOOGLE_CLIENT_SECRET: z.string().optional(),
			GITHUB_CLIENT_ID: z.string().optional(),
			GITHUB_CLIENT_SECRET: z.string().optional(),
		},
		runtimeEnv: {
			BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
			CORS_ORIGIN: process.env.CORS_ORIGIN,
			COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
			CLOUDFLARE_TURNSTILE_SECRET_KEY:
				process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
			// Start Social Providers
			DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
			DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
			GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
			GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
			GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
		},
		emptyStringAsUndefined: true,
		clientPrefix: 'NEXT_PUBLIC_',
	});

export type ServerEnv = ReturnType<typeof serverEnv>;
