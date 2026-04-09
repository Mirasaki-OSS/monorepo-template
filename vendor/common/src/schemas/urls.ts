import { z } from 'zod/v4';

const signedUrlSchema = z.object({
	expires: z.coerce
		.number()
		.int()
		.optional()
		.refine(
			(val) => val === undefined || val >= 0,
			'Expires must be a non-negative integer'
		),
	sig: z.string().optional(),
	ref: z.string().optional(),
});

type SignedUrlSchema = z.infer<typeof signedUrlSchema>;

export { type SignedUrlSchema, signedUrlSchema };
