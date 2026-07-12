import { userViewSchema } from '@md-oss/db/zod';
import { authorizationProcedure, createTRPCRouter } from '../../../';
import {
	deleteUserInputSchema,
	deleteUserOutputSchema,
	updateUserInputSchema,
} from './schema';
import {
	deleteMyUserService,
	getMyUserService,
	updateMyUserService,
} from './service';

export const usersMeRouter = createTRPCRouter({
	get: authorizationProcedure('read', 'User')
		.output(userViewSchema)
		.query(({ ctx }) => {
			return getMyUserService(ctx.auth);
		}),
	update: authorizationProcedure('update', 'User')
		.input(updateUserInputSchema)
		.output(userViewSchema)
		.mutation(({ ctx, input }) => {
			return updateMyUserService(ctx.auth, input);
		}),
	delete: authorizationProcedure('delete', 'User')
		.input(deleteUserInputSchema)
		.output(deleteUserOutputSchema)
		.mutation(({ ctx, input }) => {
			return deleteMyUserService(ctx.auth, input);
		}),
});
