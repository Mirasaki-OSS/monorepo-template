import { createDb } from '@md-oss/db';
import * as schema from '@md-oss/db/schema/auth';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { serverEnv } from './env';

export function createAuth<Options extends BetterAuthOptions>(
	options: Options = {} as Options
) {
	const [db, env] = [createDb(), serverEnv()];

	const config = {
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: 'none',
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [],
	} as const satisfies BetterAuthOptions;

	return betterAuth<typeof config & Options>({
		...config,
		...options,
	});
}

export const auth = createAuth();
