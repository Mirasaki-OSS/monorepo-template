import type { BetterAuthClientOptions } from 'better-auth';
import { createAuthClient } from 'better-auth/react';

export type { OAuth2UserInfo, RawError } from 'better-auth';
export type { InferUserUpdateCtx } from 'better-auth/client';

export type AuthClient<
	Options extends BetterAuthClientOptions = NonNullable<unknown>,
> = ReturnType<typeof createAuthClient<Options>>;

export { createAuthClient };
