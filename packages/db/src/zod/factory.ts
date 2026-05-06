import { createSchemaFactory } from 'drizzle-orm/zod';
import z4 from 'zod/v4';

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
	createSchemaFactory({
		// This configuration will not coerce anything.
		// Set `coerce` to `true` to coerce all data types or specify others
		coerce: {}, // Use case: Type coercion
		zodInstance: z4, // Use case: Using an extended Zod instance
	});

export { createInsertSchema, createSelectSchema, createUpdateSchema };
