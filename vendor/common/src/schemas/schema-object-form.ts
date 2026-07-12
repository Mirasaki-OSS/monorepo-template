import { z } from 'zod/v4';

type Unwrapped = {
	base: z.ZodTypeAny;
	isOptional: boolean;
	isNullable: boolean;
	isReadonly: boolean;
};

type EnumOption = {
	selectValue: string;
	rawValue: string | number;
	labelKey: string;
};

type SchemaTextFieldControl = 'input' | 'textarea';

type SchemaTextFieldOptions = {
	control: SchemaTextFieldControl;
	rows?: number;
};

type SchemaTemporalFieldControl = 'date' | 'time' | 'datetime';

type SchemaTemporalFieldOptions = {
	control: SchemaTemporalFieldControl;
	showSeconds?: boolean;
	min?: string;
	max?: string;
	hourStep?: number;
	minuteStep?: number;
	secondStep?: number;
	locale?: string;
	captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
};

type SchemaJSONFieldControl = 'json';

type SchemaJSONFieldOptions = {
	control: SchemaJSONFieldControl;
	rows?: number;
	validate?: boolean;
};

type SchemaFieldFormOptions =
	| SchemaTextFieldOptions
	| SchemaTemporalFieldOptions
	| SchemaJSONFieldOptions;

const normalizePositiveInteger = (value: unknown): number | undefined => {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		return undefined;
	}

	return Math.floor(value);
};

const unwrapSchema = (schema: z.ZodTypeAny): Unwrapped => {
	let current = schema;
	let isOptional = false;
	let isNullable = false;
	let isReadonly = false;

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
		if (current instanceof z.ZodReadonly) {
			isReadonly = true;
			current = current.unwrap() as z.ZodTypeAny;
			continue;
		}
		break;
	}

	return { base: current, isOptional, isNullable, isReadonly };
};

const getSchemaDescription = (schema: z.ZodTypeAny): string | undefined => {
	const withDescription = schema as { description?: string };
	return withDescription.description;
};

const getSchemaMeta = (
	schema: z.ZodTypeAny
): Record<string, unknown> | null => {
	const withMeta = schema as {
		meta?: () => unknown;
		_zod?: { def?: { metadata?: unknown; meta?: unknown } };
		_def?: { metadata?: unknown; meta?: unknown };
	};

	if (typeof withMeta.meta === 'function') {
		const metadata = withMeta.meta();
		if (metadata && typeof metadata === 'object') {
			return metadata as Record<string, unknown>;
		}
	}

	const metadata =
		withMeta._zod?.def?.metadata ??
		withMeta._zod?.def?.meta ??
		withMeta._def?.metadata ??
		withMeta._def?.meta;

	if (metadata && typeof metadata === 'object') {
		return metadata as Record<string, unknown>;
	}

	return null;
};

const withSchemaFormOptions = <TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	form: SchemaFieldFormOptions
): TSchema => {
	const currentMeta = getSchemaMeta(schema) ?? {};
	const currentForm = currentMeta.form;

	return schema.meta({
		...currentMeta,
		form:
			currentForm && typeof currentForm === 'object'
				? {
						...currentForm,
						...form,
					}
				: form,
	}) as TSchema;
};

const textareaField = <TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	options: Omit<SchemaTextFieldOptions, 'control'> = {}
): TSchema => {
	return withSchemaFormOptions(schema, {
		control: 'textarea',
		...options,
	});
};

const dateField = <TSchema extends z.ZodDate>(
	schema: TSchema,
	options: Omit<SchemaTemporalFieldOptions, 'control'> = {}
): TSchema => {
	return withSchemaFormOptions(schema, {
		control: 'date',
		...options,
	});
};
const jsonField = <TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	options: Omit<SchemaJSONFieldOptions, 'control'> = {}
): TSchema => {
	return withSchemaFormOptions(schema, {
		control: 'json',
		...options,
	});
};
const timeField = <TSchema extends z.ZodDate>(
	schema: TSchema,
	options: Omit<SchemaTemporalFieldOptions, 'control'> = {}
): TSchema => {
	return withSchemaFormOptions(schema, {
		control: 'time',
		...options,
	});
};

const dateTimeField = <
	TSchema extends
		| z.ZodDate
		| z.ZodReadonly<z.ZodDate>
		| z.ZodNullable<z.ZodDate>
		| z.ZodOptional<z.ZodDate>
		| z.ZodReadonly<z.ZodNullable<z.ZodDate>>,
>(
	schema: TSchema,
	options: Omit<SchemaTemporalFieldOptions, 'control'> = {}
): TSchema => {
	return withSchemaFormOptions(schema, {
		control: 'datetime',
		...options,
	}) as TSchema;
};

const getSchemaTextFieldOptions = (
	schema: z.ZodTypeAny
): SchemaTextFieldOptions => {
	const { base } = unwrapSchema(schema);
	const sources: z.ZodTypeAny[] = [schema, base];

	for (const source of sources) {
		const meta = getSchemaMeta(source);
		if (!meta) {
			continue;
		}

		const metaForm = meta.form;
		if (!metaForm || typeof metaForm !== 'object') {
			continue;
		}

		const control = (metaForm as { control?: unknown }).control;
		const rows = (metaForm as { rows?: unknown }).rows;

		if (control === 'textarea' || control === 'input') {
			return {
				control,
				rows:
					typeof rows === 'number' && Number.isFinite(rows) && rows > 0
						? Math.floor(rows)
						: undefined,
			};
		}
	}

	return { control: 'input' };
};

const getSchemaTemporalFieldOptions = (
	schema: z.ZodTypeAny
): SchemaTemporalFieldOptions | null => {
	const { base } = unwrapSchema(schema);
	if (!(base instanceof z.ZodDate)) {
		return null;
	}

	const sources: z.ZodTypeAny[] = [schema, base];

	for (const source of sources) {
		const meta = getSchemaMeta(source);
		if (!meta) {
			continue;
		}

		const metaForm = meta.form;
		if (!metaForm || typeof metaForm !== 'object') {
			continue;
		}

		const control = (metaForm as { control?: unknown }).control;
		if (control !== 'date' && control !== 'time' && control !== 'datetime') {
			continue;
		}

		const captionLayout = (metaForm as { captionLayout?: unknown })
			.captionLayout;

		return {
			control,
			showSeconds:
				typeof (metaForm as { showSeconds?: unknown }).showSeconds === 'boolean'
					? (metaForm as { showSeconds: boolean }).showSeconds
					: undefined,
			min:
				typeof (metaForm as { min?: unknown }).min === 'string'
					? (metaForm as { min: string }).min
					: undefined,
			max:
				typeof (metaForm as { max?: unknown }).max === 'string'
					? (metaForm as { max: string }).max
					: undefined,
			hourStep: normalizePositiveInteger(
				(metaForm as { hourStep?: unknown }).hourStep
			),
			minuteStep: normalizePositiveInteger(
				(metaForm as { minuteStep?: unknown }).minuteStep
			),
			secondStep: normalizePositiveInteger(
				(metaForm as { secondStep?: unknown }).secondStep
			),
			locale:
				typeof (metaForm as { locale?: unknown }).locale === 'string'
					? (metaForm as { locale: string }).locale
					: undefined,
			captionLayout:
				captionLayout === 'label' ||
				captionLayout === 'dropdown' ||
				captionLayout === 'dropdown-months' ||
				captionLayout === 'dropdown-years'
					? captionLayout
					: undefined,
		};
	}

	return { control: 'date' };
};

const getSchemaJSONFieldOptions = (
	schema: z.ZodTypeAny
): SchemaJSONFieldOptions | null => {
	const sources: z.ZodTypeAny[] = Array.isArray(schema) ? schema : [schema];

	for (const source of sources) {
		const meta = getSchemaMeta(source);
		if (!meta) {
			continue;
		}

		const metaForm = meta.form;
		if (!metaForm || typeof metaForm !== 'object') {
			continue;
		}

		const control = (metaForm as { control?: unknown }).control;
		if (control !== 'json') {
			continue;
		}

		const rows = (metaForm as { rows?: unknown }).rows;
		const validate = (metaForm as { validate?: unknown }).validate;

		return {
			control,
			rows:
				typeof rows === 'number' && Number.isFinite(rows) && rows > 0
					? Math.floor(rows)
					: undefined,
			validate: typeof validate === 'boolean' ? validate : undefined,
		};
	}

	return null;
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
			const elementSchema = base.element as z.ZodTypeAny;
			traverse(elementSchema, path);
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
	dateField,
	dateTimeField,
	type EnumOption,
	getEnumOptions,
	getFieldError,
	getSchemaDescription,
	getSchemaJSONFieldOptions,
	getSchemaTemporalFieldOptions,
	getSchemaTextFieldOptions,
	isNumberLikeSchema,
	isRequired,
	isStringLikeSchema,
	jsonField,
	requiredKeys,
	type SchemaFieldFormOptions,
	type SchemaJSONFieldControl,
	type SchemaJSONFieldOptions,
	type SchemaTemporalFieldControl,
	type SchemaTemporalFieldOptions,
	type SchemaTextFieldControl,
	type SchemaTextFieldOptions,
	textareaField,
	timeField,
	type Unwrapped,
	unwrapSchema,
	withSchemaFormOptions,
	zodEnumFromObjectKeys,
};
