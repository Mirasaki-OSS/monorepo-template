import type { z } from 'zod/v4';
import { account } from '../schema';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from './factory';
import type { SchemaRefinements } from './refinements';

type AccountRefinements = SchemaRefinements<typeof account>;

const accountRefinements: AccountRefinements = {};

const accountSelectSchema = createSelectSchema(account, accountRefinements);
const accountInsertSchema = createInsertSchema(account, accountRefinements);
const accountUpdateSchema = createUpdateSchema(account, accountRefinements);

type AccountSelect = z.infer<typeof accountSelectSchema>;
type AccountInsert = z.infer<typeof accountInsertSchema>;
type AccountUpdate = z.infer<typeof accountUpdateSchema>;

export {
	type AccountInsert,
	type AccountRefinements,
	type AccountSelect,
	type AccountUpdate,
	accountInsertSchema,
	accountRefinements,
	accountSelectSchema,
	accountUpdateSchema,
};
