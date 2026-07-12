import { userViewSchema } from '@md-oss/db/zod';
import { authorizationProcedure, createTRPCRouter } from '../../';
import { usersMeRouter } from './@me';
import {
	countUsersOutputSchema,
	deleteUserByIdInputSchema,
	deleteUserByIdOutputSchema,
	getUserByIdInputSchema,
	listPublicUsersViewInputSchema,
	listPublicUsersViewOutputSchema,
	listUsersDefinitionsSchema,
	listUsersInputSchema,
	listUsersOutputSchema,
	updateUserByIdInputSchema,
} from './schema';
import {
	countUsersService,
	deleteUserByIdService,
	getUserByIdService,
	listPublicUsersViewService,
	listUsersDefinitionsService,
	listUsersService,
	updateUserByIdService,
} from './service';

export const usersRouter = createTRPCRouter({
	'@me': usersMeRouter,
	byId: authorizationProcedure('read', 'User')
		.input(getUserByIdInputSchema)
		.output(userViewSchema)
		.query(({ ctx, input }) => {
			return getUserByIdService(ctx.auth, input.id);
		}),
	list: authorizationProcedure('read', 'User')
		.input(listUsersInputSchema)
		.output(listUsersOutputSchema)
		.query(({ ctx, input }) => {
			return listUsersService(ctx.auth, input);
		}),
	listDefinitions: authorizationProcedure('read', 'User')
		.output(listUsersDefinitionsSchema)
		.query(() => {
			return listUsersDefinitionsService();
		}),
	listPublic: authorizationProcedure('read', 'User')
		.input(listPublicUsersViewInputSchema)
		.output(listPublicUsersViewOutputSchema)
		.query(({ ctx, input }) => {
			return listPublicUsersViewService(ctx.auth, input);
		}),
	updateById: authorizationProcedure('update', 'User')
		.input(updateUserByIdInputSchema)
		.output(userViewSchema)
		.mutation(({ ctx, input }) => {
			return updateUserByIdService(ctx.auth, input);
		}),
	deleteById: authorizationProcedure('delete', 'User')
		.input(deleteUserByIdInputSchema)
		.output(deleteUserByIdOutputSchema)
		.mutation(({ ctx, input }) => {
			return deleteUserByIdService(ctx.auth, input);
		}),
	count: authorizationProcedure('read', 'User')
		.output(countUsersOutputSchema)
		.query(({ ctx }) => {
			return countUsersService(ctx.auth, {
				pagination: { page: 1, pageSize: 1 },
				filters: [],
				sorting: [],
				joinOperator: 'and',
			});
		}),
});
