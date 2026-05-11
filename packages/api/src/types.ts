import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { auth } from './auth';
import type { AppRouter } from './routers';

export type SessionResponse = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthenticatedSessionResponse = Exclude<SessionResponse, null>;

export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;
