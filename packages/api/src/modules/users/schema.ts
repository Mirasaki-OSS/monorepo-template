import { authzRoleEnum } from '@md-oss/authz';
import {
	cursorPaginationOptionsSchema,
	cursorPaginationOutputSchema,
	paginationOptionsSchema,
	paginationOutputSchema,
} from '@md-oss/database';
import {
	publicUserViewSchema,
	userClientMetadataSchema,
	userClientReadOnlyMetadataSchema,
	userServerMetadataSchema,
	userViewSchema,
} from '@md-oss/db/zod';
import { z } from 'zod/v4';
import { createAdvancedFilterSchemas } from '../../lib/advanced-filters';
import {
	deleteUserInputSchema,
	deleteUserOutputSchema,
	updateUserInputSchema,
} from './@me/schema';

export const adminUpdateUserInputSchema = z
	.object({
		...updateUserInputSchema.shape,
		username: z.string().trim().min(3).max(32).nullable().optional(),
		roles: z.array(authzRoleEnum).min(1).max(10).optional(),
		banned: z.boolean().optional(),
		banReason: z.string().trim().max(500).nullable().optional(),
		banExpiresAt: z.date().nullable().optional(),
		clientMetadata: userClientMetadataSchema.nullable().optional(),
		clientReadonlyMetadata: userClientReadOnlyMetadataSchema
			.nullable()
			.optional(),
		serverMetadata: userServerMetadataSchema.nullable().optional(),
	})
	.refine((input) => Object.keys(input).length > 0, {
		message: 'At least one field must be provided',
	});

export const userListStatusSchema = z.enum(['verified', 'unverified']);

export const userListSortIds = [
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
] as const;

export const userListSortItemSchema = z.object({
	id: z.enum(userListSortIds),
	desc: z.boolean(),
});

export const userListFiltersSchema = z.object({
	query: z.string().trim().min(1).max(100).nullable().default(null),
	status: z.array(userListStatusSchema).default([]),
	authMethods: z.array(z.string()).default([]),
	roles: z.array(authzRoleEnum).default([]),
	permissions: z.array(z.string()).default([]),
});

export const userAdvancedFilterIds = [
	'query',
	'email',
	'id',
	'roles',
	'permissions',
	'authMethods',
	'lastSeenAt',
	'createdAt',
	'status',
] as const;

const userAdvancedFilterSchemas = createAdvancedFilterSchemas({
	ids: userAdvancedFilterIds,
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

export const listUsersDefinitionsSchema = z.object({
	sorting: z.object({
		sortableColumns: z.array(z.enum(userListSortIds)),
		defaultSorting: z.array(userListSortItemSchema),
	}),
	filtering: z.object({
		filterableColumns: z.array(userAdvancedFilterIdSchema),
		joinOperators: z.array(userAdvancedFilterJoinOperatorSchema),
	}),
});

export const listUsersDefinitions = {
	sorting: {
		sortableColumns: [...userListSortIds],
		defaultSorting: [{ id: 'createdAt', desc: true }] as const,
	},
	filtering: {
		filterableColumns: [...userAdvancedFilterIds],
		joinOperators: ['and', 'or'] as const,
	},
} satisfies z.infer<typeof listUsersDefinitionsSchema>;

export const listUsersOutputSchema = paginationOutputSchema(
	userViewSchema
).extend({
	definitions: listUsersDefinitionsSchema,
});

export const updateUserByIdInputSchema = z.object({
	id: z.string().min(1),
	data: adminUpdateUserInputSchema,
});

export const deleteUserByIdInputSchema = deleteUserInputSchema.extend({
	id: z.string().min(1),
});

export const deleteUserByIdOutputSchema = deleteUserOutputSchema.extend({});

export const countUsersOutputSchema = z.object({
	count: z.number().int().nonnegative(),
});

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
export type ListUsersDefinitions = z.infer<typeof listUsersDefinitionsSchema>;
export type ListUsersOutput = z.infer<typeof listUsersOutputSchema>;
export type UpdateUserByIdInput = z.infer<typeof updateUserByIdInputSchema>;
export type DeleteUserByIdInput = z.infer<typeof deleteUserByIdInputSchema>;
export type DeleteUserByIdOutput = z.infer<typeof deleteUserByIdOutputSchema>;

export type CountUsersOutput = z.infer<typeof countUsersOutputSchema>;
