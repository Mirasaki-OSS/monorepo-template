import z from 'zod/v4';

type Unwrapped = {
	base: z.ZodTypeAny;
	isOptional: boolean;
	isNullable: boolean;
};

type EnumOption = {
	selectValue: string;
	rawValue: string | number;
	labelKey: string;
};

const unwrapSchema = (schema: z.ZodTypeAny): Unwrapped => {
	let current = schema;
	let isOptional = false;
	let isNullable = false;

	while (true) {
		if (current instanceof z.ZodOptional) {
			isOptional = true;
			current = current.unwrap() as z.ZodTypeAny;
			continue;
		}
		if (current instanceof z.ZodNullable) {
			isNullable = true;
			current = current.unwrap() as z.ZodTypeAny;
			continue;
		}
		if (current instanceof z.ZodDefault) {
			current = current.unwrap() as z.ZodTypeAny;
			continue;
		}
		break;
	}

	return { base: current, isOptional, isNullable };
};

const getSchemaDescription = (schema: z.ZodTypeAny): string | undefined => {
	const withDescription = schema as { description?: string };
	return withDescription.description;
};

const getFieldError = (
	errors: Record<string, string> | undefined,
	path: string[],
	includeNested = true
): string | undefined => {
	if (!errors) {
		return undefined;
	}

	const exactPath = path.join('.');
	if (errors[exactPath]) {
		return errors[exactPath];
	}

	if (!includeNested) {
		return undefined;
	}

	const nestedPrefix = `${exactPath}.`;
	for (const [key, message] of Object.entries(errors)) {
		if (key.startsWith(nestedPrefix)) {
			return message;
		}
	}

	return undefined;
};

const getEnumOptions = (schema: z.ZodTypeAny): EnumOption[] | null => {
	const { base } = unwrapSchema(schema);
	if (base instanceof z.ZodEnum) {
		const entries = Object.entries(base.enum);
		const seen = new Set<string>();
		const options: EnumOption[] = [];

		for (const [key, rawValue] of entries) {
			const selectValue = String(rawValue);
			if (seen.has(selectValue)) {
				continue;
			}

			seen.add(selectValue);
			options.push({
				selectValue,
				rawValue,
				labelKey: key,
			});
		}

		return options;
	}
	return null;
};

const isStringLikeSchema = (schema: z.ZodTypeAny): boolean => {
	const { base } = unwrapSchema(schema);

	if (base instanceof z.ZodString) {
		return true;
	}

	const probe = base.safeParse('');
	if (probe.success) {
		return typeof probe.data === 'string';
	}

	const hasOnlyTypeErrors = probe.error.issues.every(
		(issue) => issue.code === 'invalid_type'
	);

	return !hasOnlyTypeErrors;
};

const isNumberLikeSchema = (schema: z.ZodTypeAny): boolean => {
	const { base } = unwrapSchema(schema);

	if (base instanceof z.ZodNumber) {
		return true;
	}

	const probe = base.safeParse(0);
	if (probe.success) {
		return typeof probe.data === 'number';
	}

	const hasOnlyTypeErrors = probe.error.issues.every(
		(issue) => issue.code === 'invalid_type'
	);

	return !hasOnlyTypeErrors;
};

const isRequired = (schema: z.ZodTypeAny, path: string): boolean => {
	const { isOptional, isNullable } = unwrapSchema(schema);
	if (isOptional || isNullable) {
		return false;
	}

	const keys = path.split('.');
	let current: z.ZodTypeAny = schema;

	for (const key of keys) {
		if (!(current instanceof z.ZodObject)) {
			return false;
		}

		current = current.shape[key];
		if (!current) {
			return false;
		}

		const unwrapped = unwrapSchema(current);
		if (unwrapped.isOptional || unwrapped.isNullable) {
			return false;
		}
	}

	return true;
};

const requiredKeys = (schema: z.ZodTypeAny): string[] => {
	const required: string[] = [];

	const traverse = (zodType: z.ZodTypeAny, path: string[] = []): void => {
		const { base, isOptional, isNullable } = unwrapSchema(zodType);

		if (base instanceof z.ZodObject) {
			const shape = base.shape;
			for (const key in shape) {
				const field = shape[key];

				if (isOptional || isNullable) continue;

				const newPath = [...path, key];
				traverse(field, newPath);
			}
		} else if (base instanceof z.ZodArray) {
			traverse(base, path);
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
const zodEnumFromObjectKeys = <
	TI extends Record<string, unknown>,
	R extends string = TI extends Record<infer R, unknown> ? R : never,
>(
	input: TI
): z.ZodEnum<{
	[K in R]: K;
}> => {
	const [firstKey, ...otherKeys] = Object.keys(input) as [R, ...R[]];
	return z.enum([firstKey, ...otherKeys]);
};

export {
	type EnumOption,
	getEnumOptions,
	getFieldError,
	getSchemaDescription,
	isNumberLikeSchema,
	isRequired,
	isStringLikeSchema,
	requiredKeys,
	type Unwrapped,
	unwrapSchema,
	zodEnumFromObjectKeys,
};
