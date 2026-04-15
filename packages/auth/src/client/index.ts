import { createAuthClient } from 'better-auth/react';
import { clientEnv } from './env';

const env = clientEnv();

const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export type { OAuth2UserInfo, RawError } from 'better-auth';
export type { InferUserUpdateCtx } from 'better-auth/client';

export { authClient, createAuthClient };
