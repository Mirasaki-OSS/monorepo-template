import { z } from 'zod/v4';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../';

export const appRouter = createTRPCRouter({
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
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: 'This is private',
			user: ctx.auth.user,
		};
	}),
});

export type AppRouter = typeof appRouter;
