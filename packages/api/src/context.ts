import { buildAbilityForActor } from '@md-oss/authz';
import type { Context as HonoContext } from 'hono';
import { auth } from './auth';
import type { ServerAuthContext } from './types';

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({
	context,
}: CreateContextOptions): Promise<{ auth: ServerAuthContext | null }> {
	const sessionResponse = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return {
		auth: sessionResponse
			? {
					...sessionResponse,
					ability: buildAbilityForActor(sessionResponse.actor),
				}
			: null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
export type {
	AuthContext,
	ClientAuthContext,
	ServerAuthContext,
} from './types';
