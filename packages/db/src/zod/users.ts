import { z } from 'zod/v4';
import { user } from '../schema';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from './factory';
import type { SchemaRefinements } from './refinements';

type UserRefinements = SchemaRefinements<typeof user>;

const userClientMetadataSchema = z.object({}).required();
const userClientReadOnlyMetadataSchema = z.object({}).required();
const userServerMetadataSchema = z.object({}).required();

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
	name: (schema) => schema.max(30), // Extends schema
	...userMetadataSchema.shape, // Overwrites the fields, including nullability
};

const userSelectSchema = createSelectSchema(user, userRefinements);
const userInsertSchema = createInsertSchema(user, userRefinements);
const userUpdateSchema = createUpdateSchema(user, userRefinements);

type UserSelect = z.infer<typeof userSelectSchema>;
type UserInsert = z.infer<typeof userInsertSchema>;
type UserUpdate = z.infer<typeof userUpdateSchema>;

/**
 * Private/restricted view of the User model, used for API responses and client-side data.
 */
const userViewSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
	emailVerified: z.boolean(),
	image: z.string().nullable(),
	username: z.string().nullable(),
	displayUsername: z.string().nullable(),
	bio: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	lastSeenAt: z.date().nullable(),
	authMethods: z.array(z.string()),
}) satisfies z.ZodType<Partial<UserSelect>>;

type UserView = z.infer<typeof userViewSchema>;

/**
 * Public view of the User model, containing only non-sensitive fields that can be safely exposed to clients and other users.
 */
const publicUserViewSchema = userViewSchema
	.pick({
		id: true,
		name: true,
		image: true,
		username: true,
		displayUsername: true,
		bio: true,
	})
	.strict();

type PublicUserView = z.infer<typeof publicUserViewSchema>;

export {
	type PublicUserView,
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
	userClientMetadataSchema,
	userClientReadOnlyMetadataSchema,
	userInsertSchema,
	userRefinements,
	userSelectSchema,
	userServerMetadataSchema,
	userUpdateSchema,
	userViewSchema,
};
