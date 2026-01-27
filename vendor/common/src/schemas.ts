import {
	ZodArray,
	ZodDefault,
	ZodNullable,
	ZodObject,
	ZodOptional,
	type ZodType,
	z,
} from 'zod/v4';

type FormDataFromSchema<T extends ZodObject = ZodObject> = z.infer<T>;

function unwrapZodType(zodType: ZodType | FormDataFromSchema) {
	if (
		zodType instanceof ZodOptional ||
		zodType instanceof ZodNullable ||
		zodType instanceof ZodDefault
	) {
		return unwrapZodType(zodType);
	}

	return typeof zodType === 'string' ? zodType : zodType.type;
}

const isFieldRequired = (
	schema: ZodType | FormDataFromSchema,
	path: string
): boolean => {
	const keys = path.split('.');
	let current: ZodType | FormDataFromSchema | undefined = schema;

	for (const key of keys) {
		if (!(current instanceof ZodObject)) return false;

		current = current.shape[key];

		if (!current) return false;
	}

	return !(current instanceof ZodOptional || current instanceof ZodNullable);
};

const requiredKeys = (schema: ZodType | FormDataFromSchema): string[] => {
	const required: string[] = [];

	const traverse = (
		zodType: ZodType | FormDataFromSchema,
		path: string[] = []
	): void => {
		const unwrapped = unwrapZodType(zodType);

		if (unwrapped instanceof ZodObject) {
			const shape = unwrapped.shape;
			for (const key in shape) {
				const field = shape[key];

				if (field instanceof ZodOptional || field instanceof ZodNullable)
					continue;

				const newPath = [...path, key];
				traverse(field, newPath);
			}
		} else if (unwrapped instanceof ZodArray) {
			traverse(unwrapped, path);
		} else {
			required.push(path.join('.'));
		}
	};

	traverse(schema);
	return required;
};

/**
 * Converts a plain object's keys into ZodEnum with type safety and autocompletion
 */
function zodEnumFromObjectKeys<
	TI extends Record<string, unknown>,
	R extends string = TI extends Record<infer R, unknown> ? R : never,
>(
	input: TI
): z.ZodEnum<{
	[K in R]: K;
}> {
	const [firstKey, ...otherKeys] = Object.keys(input) as [R, ...R[]];
	return z.enum([firstKey, ...otherKeys]);
}

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

type Pagination = {
	totalItems: number;
	currentPage: number;
	itemsPerPage: number;
	totalPages: number;
	limit: number;
	offset: number;
};

const paginationQuerySchema = ({
	min = 1,
	max = 100,
	defaultLimit = 25,
}: {
	min?: number;
	max?: number;
	defaultLimit?: number;
} = {}) => {
	return z.object({
		limit: z.coerce
			.number()
			.int()
			.min(min, { message: `Limit must be at least ${min}` })
			.max(max, { message: `Limit must be at most ${max}` })
			.default(defaultLimit),
		offset: z.coerce
			.number()
			.int()
			.min(0, { message: 'Offset must be 0 or greater' })
			.default(0),
	});
};

export {
	type FormDataFromSchema,
	isFieldRequired,
	requiredKeys,
	zodEnumFromObjectKeys,
	signedUrlSchema,
	type SignedUrlSchema,
	paginationQuerySchema,
	type Pagination,
};
