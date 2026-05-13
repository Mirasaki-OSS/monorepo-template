import { z } from 'zod/v4';
import { authorizationProcedure, createTRPCRouter, publicProcedure } from '../';
import { usersRouter } from '../modules/users';

export const appRouter = createTRPCRouter({
	users: usersRouter,
	hello: publicProcedure
		.input(
			z.object({
				text: z.string(),
			})
		)
		.query((opts) => {
			return {
				greeting: `Hello ${opts.input.text}`,
			};
		}),
	healthCheck: publicProcedure.query(() => {
		return 'OK';
	}),
	privateData: authorizationProcedure('read', 'User').query(({ ctx }) => {
		return {
			message: 'This is private',
			user: ctx.auth.user,
		};
	}),
});

export type AppRouter = typeof appRouter;
