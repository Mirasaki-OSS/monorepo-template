import type { z } from 'zod/v4';
import { session } from '../schema';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from './factory';
import type { SchemaRefinements } from './refinements';

type SessionRefinements = SchemaRefinements<typeof session>;

const sessionRefinements: SessionRefinements = {};

const sessionSelectSchema = createSelectSchema(session, sessionRefinements);
const sessionInsertSchema = createInsertSchema(session, sessionRefinements);
const sessionUpdateSchema = createUpdateSchema(session, sessionRefinements);

type SessionSelect = z.infer<typeof sessionSelectSchema>;
type SessionInsert = z.infer<typeof sessionInsertSchema>;
type SessionUpdate = z.infer<typeof sessionUpdateSchema>;

export {
	type SessionInsert,
	type SessionRefinements,
	type SessionSelect,
	type SessionUpdate,
	sessionInsertSchema,
	sessionRefinements,
	sessionSelectSchema,
	sessionUpdateSchema,
};
