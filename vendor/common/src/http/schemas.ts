import { z } from 'zod';

export const httpErrorResponseSchema = z.object({
	ok: z.literal(false),
	statusCode: z.number().int(),
	statusText: z.string(),
	headers: z.record(z.string(), z.string()),
	code: z.string(),
	message: z.string(),
	details: z.record(z.string(), z.unknown()).nullable(),
});
