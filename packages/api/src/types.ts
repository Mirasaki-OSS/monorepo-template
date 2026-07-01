import type { AppAbilityLike } from '@md-oss/authz';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { auth } from './auth';
import type { AppRouter } from './routers';

export type SessionResponse = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthenticatedSessionResponse = Exclude<SessionResponse, null>;
export type AuthContext<IsClient extends boolean> = Omit<
	AuthenticatedSessionResponse,
	'ability'
> & {
	ability: IsClient extends true ? never : AppAbilityLike;
};

export type ClientAuthContext = AuthContext<true>;
export type ServerAuthContext = AuthContext<false>;

export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;

export * from '@md-oss/db/zod';
export * from './modules/users/@me/schema';
export * from './modules/users/schema';
