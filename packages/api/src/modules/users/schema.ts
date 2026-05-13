import {
	cursorPaginationOptionsSchema,
	cursorPaginationOutputSchema,
	paginationOptionsSchema,
	paginationOutputSchema,
} from '@md-oss/database';
import { publicUserViewSchema, userViewSchema } from '@md-oss/db/zod';
import { z } from 'zod/v4';
import { createAdvancedFilterSchemas } from '../../lib/advanced-filters';
import {
	deleteUserInputSchema,
	deleteUserOutputSchema,
	updateUserInputSchema,
} from './@me/schema';

export const userListStatusSchema = z.enum(['verified', 'unverified']);

export const userListSortItemSchema = z.object({
	id: z.enum([
		'createdAt',
		'updatedAt',
		'id',
		'name',
		'email',
		'username',
		'displayUsername',
		'status',
		'authMethods',
		'query',
	]),
	desc: z.boolean(),
});

export const userListFiltersSchema = z.object({
	query: z.string().trim().min(1).max(100).nullable().default(null),
	status: z.array(userListStatusSchema).default([]),
	authMethods: z.array(z.string()).default([]),
});

const userAdvancedFilterSchemas = createAdvancedFilterSchemas({
	ids: [
		'query',
		'email',
		'id',
		'authMethods',
		'lastSeenAt',
		'createdAt',
		'status',
	] as const,
});

export const userAdvancedFilterIdSchema = userAdvancedFilterSchemas.idSchema;
export const userAdvancedFilterItemSchema =
	userAdvancedFilterSchemas.itemSchema;
export const userAdvancedFilterJoinOperatorSchema =
	userAdvancedFilterSchemas.joinOperatorSchema;

const publicUserAdvancedFilterSchemas = createAdvancedFilterSchemas({
	ids: ['query', 'status'] as const,
});

export const publicUserAdvancedFilterIdSchema =
	publicUserAdvancedFilterSchemas.idSchema;
export const publicUserAdvancedFilterItemSchema =
	publicUserAdvancedFilterSchemas.itemSchema;
export const publicUserAdvancedFilterJoinOperatorSchema =
	publicUserAdvancedFilterSchemas.joinOperatorSchema;

export const getUserByIdInputSchema = z.object({
	id: z.string().min(1),
});

export const listPublicUsersViewInputSchema =
	cursorPaginationOptionsSchema.extend({
		filters: z.array(publicUserAdvancedFilterItemSchema).default([]),
		joinOperator: publicUserAdvancedFilterJoinOperatorSchema,
		sorting: z.array(userListSortItemSchema).default([]),
	});

export const listPublicUsersViewOutputSchema =
	cursorPaginationOutputSchema(publicUserViewSchema);

export const listUsersInputSchema = z.object({
	pagination: paginationOptionsSchema,
	filters: z.array(userAdvancedFilterItemSchema).default([]),
	sorting: z.array(userListSortItemSchema).default([]),
	joinOperator: userAdvancedFilterJoinOperatorSchema,
});

export const listUsersOutputSchema = paginationOutputSchema(userViewSchema);

export const updateUserByIdInputSchema = z.object({
	id: z.string().min(1),
	data: updateUserInputSchema,
});

export const deleteUserByIdInputSchema = deleteUserInputSchema.extend({
	id: z.string().min(1),
});

export const deleteUserByIdOutputSchema = deleteUserOutputSchema.extend({});

export type UserListStatus = z.infer<typeof userListStatusSchema>;
export type UserListSortItem = z.infer<typeof userListSortItemSchema>;
export type UserListFilters = z.infer<typeof userListFiltersSchema>;

export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;
export type ListPublicUsersViewInput = z.infer<
	typeof listPublicUsersViewInputSchema
>;
export type ListPublicUsersViewOutput = z.infer<
	typeof listPublicUsersViewOutputSchema
>;
export type ListUsersInput = z.infer<typeof listUsersInputSchema>;
export type ListUsersOutput = z.infer<typeof listUsersOutputSchema>;
export type UpdateUserByIdInput = z.infer<typeof updateUserByIdInputSchema>;
export type DeleteUserByIdInput = z.infer<typeof deleteUserByIdInputSchema>;
export type DeleteUserByIdOutput = z.infer<typeof deleteUserByIdOutputSchema>;
