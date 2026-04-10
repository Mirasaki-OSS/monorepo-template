export type JsonPrimitive = string | number | boolean | null;
export type JsonValueLike =
	| JsonPrimitive
	| { [key: string]: JsonValueLike }
	| JsonValueLike[];

/**
 * Converts runtime javascript types into JSON-safe transport types.
 * Example: Date -> string, bigint -> string.
 */
export type SerializedJson<T> = T extends Date
	? string
	: T extends bigint
		? string
		: T extends JsonValueLike
			? T // Note: Preserves JSON-safe types as-is
			: T extends Array<infer U>
				? SerializedJson<U>[]
				: T extends ReadonlyArray<infer U>
					? ReadonlyArray<SerializedJson<U>>
					: T extends object
						? { [K in keyof T]: SerializedJson<T[K]> }
						: T;

const ISO_UTC_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const bigIntSerializationHelper = (
	_key: string,
	value: unknown
): unknown =>
	typeof value === 'bigint'
		? value > BigInt(Number.MAX_SAFE_INTEGER)
			? value.toString()
			: Number(value)
		: value;

export type JsonParseOptions = {
	reviveDates?: boolean;
	reviver?: (key: string, value: unknown) => unknown;
};

export type JsonStringifyOptions = {
	replacer?: (key: string, value: unknown) => unknown;
	space?: number | string;
	stable?: boolean;
};

const dateReviver = (_key: string, value: unknown) => {
	if (
		typeof value === 'string' &&
		value.length >= 20 &&
		ISO_UTC_DATE_RE.test(value)
	) {
		const date = new Date(value);
		if (!Number.isNaN(date.getTime())) {
			return date;
		}
	}
	return value;
};

const createReviver = (
	options: JsonParseOptions | undefined
): ((key: string, value: unknown) => unknown) | undefined => {
	if (!options?.reviver && !options?.reviveDates) {
		return undefined;
	}

	return (key: string, value: unknown) => {
		const maybeRevivedDate = options?.reviveDates
			? dateReviver(key, value)
			: value;
		return options?.reviver
			? options.reviver(key, maybeRevivedDate)
			: maybeRevivedDate;
	};
};

export const stableSerializeForCacheKey = (value: unknown): string => {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}

	if (Array.isArray(value)) {
		return `[${value.map((item) => stableSerializeForCacheKey(item)).join(',')}]`;
	}

	const entries = Object.entries(value as Record<string, unknown>).sort(
		([keyA], [keyB]) => keyA.localeCompare(keyB)
	);

	return `{${entries
		.map(
			([key, item]) =>
				`${JSON.stringify(key)}:${stableSerializeForCacheKey(item)}`
		)
		.join(',')}}`;
};

export const parseJson = <T = unknown>(
	value: string,
	options?: JsonParseOptions
): T => {
	const reviver = createReviver(options);
	return JSON.parse(value, reviver) as T;
};

export const stringifyJson = (
	value: unknown,
	options?: JsonStringifyOptions
): string => {
	const normalized = options?.stable
		? parseJson(stableSerializeForCacheKey(value))
		: value;

	return JSON.stringify(
		normalized,
		options?.replacer ?? bigIntSerializationHelper,
		options?.space
	);
};

export const serializeJson = <T>(value: T): SerializedJson<T> =>
	parseJson<SerializedJson<T>>(stringifyJson(value));
