import type { z } from 'zod/v4';
import { verification } from '../schema';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from './factory';
import type { SchemaRefinements } from './refinements';

type VerificationRefinements = SchemaRefinements<typeof verification>;

const verificationRefinements: VerificationRefinements = {};

const verificationSelectSchema = createSelectSchema(
	verification,
	verificationRefinements
);
const verificationInsertSchema = createInsertSchema(
	verification,
	verificationRefinements
);
const verificationUpdateSchema = createUpdateSchema(
	verification,
	verificationRefinements
);

type VerificationSelect = z.infer<typeof verificationSelectSchema>;
type VerificationInsert = z.infer<typeof verificationInsertSchema>;
type VerificationUpdate = z.infer<typeof verificationUpdateSchema>;

export {
	type VerificationInsert,
	type VerificationRefinements,
	type VerificationSelect,
	type VerificationUpdate,
	verificationInsertSchema,
	verificationRefinements,
	verificationSelectSchema,
	verificationUpdateSchema,
};
