import {
	type AuthzRole,
	authzRolesRefinement,
	authzRoleUnion,
	getPrimaryRole,
	normalizeRoles,
} from '@md-oss/authz';
import {
	dateTimeField,
	jsonField,
} from '@md-oss/common/schemas/schema-object-form';
import { z } from 'zod/v4';
import { user } from '../schema';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from './factory';
import type { SchemaRefinements } from './refinements';

type UserRefinements = SchemaRefinements<typeof user>;

const userClientMetadataSchema = jsonField(
	z.record(z.string(), z.unknown()).nullable()
);
const userClientReadOnlyMetadataSchema = jsonField(
	z.record(z.string(), z.unknown()).nullable()
);
const userServerMetadataSchema = jsonField(
	z.record(z.string(), z.unknown()).nullable()
);

type UserClientMetadata = z.infer<typeof userClientMetadataSchema>;
type UserClientReadOnlyMetadata = z.infer<
	typeof userClientReadOnlyMetadataSchema
>;
type UserServerMetadata = z.infer<typeof userServerMetadataSchema>;

const userMetadataSchema = z.object({
	clientMetadata: userClientMetadataSchema,
	clientReadonlyMetadata: userClientReadOnlyMetadataSchema,
	serverMetadata: userServerMetadataSchema,
});

type UserMetadata = z.infer<typeof userMetadataSchema>;

const userRefinements: UserRefinements = {
	// Note: Using (schema) => {...} extends the schema, but anything can be overridden entirely
	id: (schema) =>
		schema
			.readonly()
			.describe(
				'Unique identifier for the user, typically a UUID v7. Read-only.'
			),
	name: (schema) =>
		schema
			.min(1)
			.max(32)
			.describe('The name of the user. Can be up to 32 characters long.'),
	email: z
		.email()
		.max(255)
		.readonly()
		.describe('The email address of the user. Must be a valid email format.'),
	emailVerified: (schema) =>
		schema
			.readonly()
			.describe(
				'Indicates whether the user has verified their email address. Read-only.'
			),
	image: z
		.union([z.url(), z.null(), z.string()])
		.describe("URL to the user's profile image (or data URI)."),
	username: (schema) =>
		schema
			.min(3)
			.max(32)
			.describe(
				'The username of the user. Can be used for display purposes or as a unique handle.'
			),
	displayUsername: (schema) =>
		schema
			.min(3)
			.max(32)
			.describe(
				'The display username of the user. Can be used for display purposes and may differ from the actual username.'
			),
	bio: (schema) =>
		schema.max(160).meta({
			id: 'bio',
			title: 'Biography',
			description: 'A short biography or description of the user.',
			form: {
				control: 'textarea',
				rows: 3,
			},
		}),
	// Moderation
	banned: (schema) =>
		schema
			.readonly()
			.describe('Indicates whether the user is banned. Read-only.'),
	banExpiresAt: (schema) =>
		dateTimeField(
			schema
				.nullable()
				.readonly()
				.describe(
					'The date and time when the user ban expires, if applicable. Read-only.'
				)
		),
	banReason: (schema) =>
		schema
			.max(500)
			.nullable()
			.readonly()
			.describe('The reason for the user ban, if applicable. Read-only.'),
	roles: (schema) =>
		schema
			.readonly()
			.transform(normalizeRoles)
			.refine(authzRolesRefinement)
			.describe(
				'An array of roles assigned to the user (e.g., "admin", "moderator"). Read-only.'
			),
	createdAt: (schema) =>
		dateTimeField(
			schema
				.readonly()
				.describe('The date and time when the user was created. Read-only.')
		),
	updatedAt: (schema) =>
		dateTimeField(
			schema.describe('The date and time when the user was last updated.')
		),
	...userMetadataSchema.shape,
};

const userSelectSchema = createSelectSchema(user, userRefinements).strict();
const userInsertSchema = createInsertSchema(user, userRefinements).strict();
const userUpdateSchema = createUpdateSchema(user, userRefinements)
	.strict()
	.refine((data) => {
		if (data.banned && !data.banReason) {
			return {
				success: false,
				message: 'Ban reason is required when banning a user.',
			};
		}

		return { success: true };
	});

type WithUserMetadataType<T> = Omit<T, keyof UserMetadata> & UserMetadata;

type UserSelect = WithUserMetadataType<z.infer<typeof userSelectSchema>>;
type UserInsert = WithUserMetadataType<z.infer<typeof userInsertSchema>>;
type UserUpdate = WithUserMetadataType<z.infer<typeof userUpdateSchema>>;

/**
 * Private/restricted view of the User model, used for API responses and client-side data.
 */
const userViewObjectSchema = z
	.object({
		...userSelectSchema.shape,
		roles: authzRoleUnion
			.readonly()
			.transform(normalizeRoles)
			.refine(authzRolesRefinement),
		lastSeenAt: dateTimeField(
			z
				.date()
				.nullable()
				.readonly()
				.describe(
					'The date and time when the user was last seen/active. Read-only.'
				)
		),
		authMethods: z
			.array(z.string())
			.readonly()
			.describe(
				'An array of authentication methods associated with the user (e.g., "password", "oauth"). Read-only.'
			),
		...userMetadataSchema.shape,
		// Allow transformed fields, like primaryRole, which is derived from roles
		primaryRole: z
			.string()
			.readonly()
			.describe(
				'The primary role of the user, derived from the roles array. Read-only.'
			),
	})
	.strict() satisfies z.ZodType<
	Partial<
		Omit<UserSelect, 'roles'> & {
			roles: readonly AuthzRole[];
		}
	>
>;

const userViewSchema = userViewObjectSchema.transform((data) => {
	const roles = normalizeRoles(data.roles);
	return {
		...data,
		primaryRole: getPrimaryRole(roles),
	};
});

type UserView = z.output<typeof userViewSchema>;
type UserViewInput = z.input<typeof userViewSchema>;

/**
 * Public view of the User model, containing only non-sensitive fields that can be safely exposed to clients and other users.
 */
const publicUserViewObjectSchema = userViewObjectSchema
	.pick({
		id: true,
		name: true,
		image: true,
		username: true,
		displayUsername: true,
		bio: true,
	})
	.strict();

const publicUserViewSchema = publicUserViewObjectSchema;

type PublicUserView = z.output<typeof publicUserViewSchema>;
type PublicUserViewInput = z.input<typeof publicUserViewSchema>;

function createEmptyUser(): UserView {
	const now = new Date();
	const roles: AuthzRole[] = ['user'];
	return {
		id: '',
		name: '',
		email: '',
		bio: null,
		image: null,
		username: null,
		authMethods: [],
		createdAt: now,
		updatedAt: now,
		emailVerified: false,
		displayUsername: null,
		lastSeenAt: null,
		clientMetadata: {},
		clientReadonlyMetadata: {},
		serverMetadata: {},
		banExpiresAt: null,
		banReason: null,
		banned: false,
		roles,
		primaryRole: getPrimaryRole(roles),
	};
}

function mapUserToView(
	record: UserSelect,
	lastSeenAt: Date | null,
	authMethods: string[]
): UserView {
	const roles = normalizeRoles(record.roles);
	return {
		...record,
		roles,
		lastSeenAt,
		authMethods,
		primaryRole: getPrimaryRole(roles),
	};
}

function mapUserToPublicView(record: UserSelect): PublicUserView {
	return {
		id: record.id,
		name: record.name,
		image: record.image,
		username: record.username,
		displayUsername: record.displayUsername,
		bio: record.bio,
	};
}

export {
	createEmptyUser,
	mapUserToPublicView,
	mapUserToView,
	type PublicUserView,
	type PublicUserViewInput,
	publicUserViewSchema,
	type UserClientMetadata,
	type UserClientReadOnlyMetadata,
	type UserInsert,
	type UserMetadata,
	type UserRefinements,
	type UserSelect,
	type UserServerMetadata,
	type UserUpdate,
	type UserView,
	type UserViewInput,
	userClientMetadataSchema,
	userClientReadOnlyMetadataSchema,
	userInsertSchema,
	userRefinements,
	userSelectSchema,
	userServerMetadataSchema,
	userUpdateSchema,
	userViewSchema,
};
