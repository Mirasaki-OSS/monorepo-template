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

export {
	type UserClientMetadata,
	type UserClientReadOnlyMetadata,
	type UserInsert,
	type UserMetadata,
	type UserRefinements,
	type UserSelect,
	type UserServerMetadata,
	type UserUpdate,
	userClientMetadataSchema,
	userClientReadOnlyMetadataSchema,
	userInsertSchema,
	userRefinements,
	userSelectSchema,
	userServerMetadataSchema,
	userUpdateSchema,
};
