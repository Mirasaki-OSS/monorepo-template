import z from 'zod/v4';

const slugRegex = '^[a-z0-9]+(?:-[a-z0-9]+)*$';

type ZodSlugOptions = {
	/** @default 3 */
	minLength?: number;
	/** @default 50 */
	maxLength?: number;
	/** @default [] */
	reservedWords?: string[];
};

/**
 * @param options {@link ZodSlugOptions} for customizing slug validation
 * @returns Zod schema for slug validation
 */
const zodSlug = (options: ZodSlugOptions = {}) => {
	const { minLength = 3, maxLength = 50, reservedWords = [] } = options;

	return z
		.string()
		.min(minLength, {
			message: `Slug must be at least ${minLength} characters long`,
		})
		.max(maxLength, {
			message: `Slug must be at most ${maxLength} characters long`,
		})
		.regex(new RegExp(slugRegex), {
			message: 'Invalid slug format',
		})
		.refine((val) => !reservedWords.includes(val), {
			message: 'This slug is reserved and cannot be used',
		});
};

export { slugRegex, type ZodSlugOptions, zodSlug };
