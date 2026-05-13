import type { Context as HonoContext } from 'hono';
import { auth } from './auth';
import type { AuthContext } from './types';

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({
	context,
}: CreateContextOptions): Promise<{ auth: AuthContext | null }> {
	const sessionResponse = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return {
		auth: sessionResponse || null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
export type { AuthContext } from './types';
