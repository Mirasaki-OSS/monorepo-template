import type { AppAbilityLike } from '@md-oss/authz';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { auth } from './auth';
import type { AppRouter } from './routers';

export type SessionResponse = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthenticatedSessionResponse = Exclude<SessionResponse, null>;
export type AuthContext = Omit<AuthenticatedSessionResponse, 'ability'> & {
	ability: AppAbilityLike;
};

export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;

export * from '@md-oss/db/zod';
export * from './modules/users/@me/schema';
export * from './modules/users/schema';
