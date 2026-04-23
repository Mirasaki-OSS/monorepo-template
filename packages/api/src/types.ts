import type { auth } from '@md-oss/auth/server';

export type SessionResponse = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthenticatedSessionResponse = Exclude<SessionResponse, null>;
