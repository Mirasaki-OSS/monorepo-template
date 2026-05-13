import { type AuthzAction, type AuthzSubject, can } from '@md-oss/authz';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
	/**
	 * @see https://trpc.io/docs/server/data-transformers
	 */
	transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.auth) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
			cause: 'No session',
		});
	}
	return next({
		ctx: {
			...ctx,
			auth: ctx.auth,
		},
	});
});

export function authorizationProcedure(
	action: AuthzAction,
	subject: AuthzSubject
) {
	return protectedProcedure.use(({ ctx, next }) => {
		if (!can(ctx.auth.ability, action, subject)) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: `Insufficient permission: ${action} ${subject}`,
			});
		}

		return next();
	});
}
