import type { Context as HonoContext } from 'hono';
import { auth } from './auth';

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const sessionResponse = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	return {
		auth: sessionResponse
			? {
					user: sessionResponse.user,
					session: sessionResponse.session,
				}
			: null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
