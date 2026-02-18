type GenericObject = Record<string, unknown>;

/**
 * Check if a value is a plain object
 * @param item - Value to check
 * @returns True if value is a plain object
 * @example isObject({}) // true, isObject(null) // false
 */
const isObject = (item: unknown): item is GenericObject =>
	typeof item === 'object' && item !== null;

/**
 * Check if an object is empty (has no own properties)
 * @param item - Object to check
 * @returns True if object is empty
 * @example isEmptyObject({}) // true, isEmptyObject({a: 1}) // false
 */
const isEmptyObject = (item: unknown): item is GenericObject =>
	isObject(item) && Object.keys(item).length === 0;

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Deep cloned copy
 * @example deepClone({a: {b: 1}}) // {a: {b: 1}} (new reference)
 */
const deepClone = <T>(obj: T): T => {
	if (obj === null || typeof obj !== 'object') return obj;
	if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
	if (Array.isArray(obj)) {
		return obj.map((item) => deepClone(item)) as unknown as T;
	}
	if (obj instanceof Object) {
		const cloned = {} as T;
		for (const key in obj) {
			if (Object.hasOwn(obj, key)) {
				cloned[key] = deepClone(obj[key]);
			}
		}
		return cloned;
	}
	return obj;
};

/**
 * Deep merge multiple objects
 * @param objects - Objects to merge
 * @returns Merged object
 * @example deepMerge({a: 1}, {b: 2}, {a: 3}) // {a: 3, b: 2}
 */
const deepMerge = <T extends GenericObject>(...objects: T[]): T => {
	const result = {} as T;

	for (const obj of objects) {
		if (!isObject(obj)) continue;

		for (const key in obj) {
			if (!Object.hasOwn(obj, key)) continue;

			const sourceValue = obj[key];
			const targetValue = result[key];

			if (isObject(sourceValue) && isObject(targetValue)) {
				result[key] = deepMerge(targetValue, sourceValue) as T[Extract<
					keyof T,
					string
				>];
			} else {
				result[key] = sourceValue as T[Extract<keyof T, string>];
			}
		}
	}

	return result;
};

/**
 * Get a nested value from an object using a path string
 * @param obj - Object to search
 * @param path - Path string (e.g., "user.address.city")
 * @param delimiter - Path delimiter (default: ".")
 * @returns Value at path or undefined
 * @example getNestedValue({a: {b: {c: 1}}}, 'a.b.c') // 1
 */
const getNestedValue = <T = unknown>(
	obj: GenericObject,
	path: string,
	delimiter = '.'
): T | undefined => {
	const keys = path.split(delimiter);
	let current: unknown = obj;

	for (const key of keys) {
		if (!isObject(current)) return undefined;
		current = current[key];
	}

	return current as T;
};

/**
 * Set a nested value in an object using a path string
 * @param obj - Object to modify
 * @param path - Path string (e.g., "user.address.city")
 * @param value - Value to set
 * @param delimiter - Path delimiter (default: ".")
 * @returns The modified object
 * @example setNestedValue({}, 'a.b.c', 1) // {a: {b: {c: 1}}}
 */
const setNestedValue = (
	obj: GenericObject,
	path: string,
	value: unknown,
	delimiter = '.'
): GenericObject => {
	const keys = path.split(delimiter);
	let current: GenericObject = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (!isObject(current[key])) {
			current[key] = {};
		}
		current = current[key] as GenericObject;
	}

	const lastKey = keys[keys.length - 1];
	current[lastKey] = value;

	return obj;
};

/**
 * Pick specific keys from an object
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only the specified keys
 * @example pick({a: 1, b: 2, c: 3}, ['a', 'c']) // {a: 1, c: 3}
 */
const pick = <T extends GenericObject, K extends keyof T>(
	obj: T,
	keys: K[]
): Pick<T, K> => {
	const result = {} as Pick<T, K>;
	for (const key of keys) {
		if (key in obj) {
			result[key] = obj[key];
		}
	}
	return result;
};

/**
 * Omit specific keys from an object
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without the specified keys
 * @example omit({a: 1, b: 2, c: 3}, ['b']) // {a: 1, c: 3}
 */
const omit = <T extends GenericObject, K extends keyof T>(
	obj: T,
	keys: K[]
): Omit<T, K> => {
	const result = { ...obj } as T;
	for (const key of keys) {
		delete result[key];
	}
	return result as Omit<T, K>;
};

/**
 * Flatten a nested object into a single level with dot notation keys
 * @param obj - Object to flatten
 * @param prefix - Key prefix (used internally for recursion)
 * @returns Flattened object
 * @example flattenObject({a: {b: {c: 1}}}) // {'a.b.c': 1}
 */
const flattenObject = (
	obj: GenericObject,
	prefix = ''
): Record<string, unknown> => {
	const result: Record<string, unknown> = {};

	for (const key in obj) {
		if (!Object.hasOwn(obj, key)) continue;

		const value = obj[key];
		const newKey = prefix ? `${prefix}.${key}` : key;

		if (isObject(value) && !Array.isArray(value)) {
			Object.assign(result, flattenObject(value, newKey));
		} else {
			result[newKey] = value;
		}
	}

	return result;
};

/**
 * Get all keys from an object with proper typing
 * @param obj - Object to get keys from
 * @returns Array of keys
 * @example objectKeys({a: 1, b: 2}) // ['a', 'b'] with proper types
 */
const objectKeys = <T extends GenericObject>(obj: T): (keyof T)[] => {
	return Object.keys(obj) as (keyof T)[];
};

/**
 * Map object values while preserving keys
 * @param obj - Object to map
 * @param fn - Mapping function
 * @returns New object with mapped values
 * @example mapValues({a: 1, b: 2}, v => v * 2) // {a: 2, b: 4}
 */
const mapValues = <T extends GenericObject, R>(
	obj: T,
	fn: (value: T[keyof T], key: keyof T) => R
): Record<keyof T, R> => {
	const result = {} as Record<keyof T, R>;
	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			result[key] = fn(obj[key], key);
		}
	}
	return result;
};

/**
 * Map object keys while preserving values
 * @param obj - Object to map
 * @param fn - Mapping function
 * @returns New object with mapped keys
 * @example mapKeys({a: 1, b: 2}, k => k.toUpperCase()) // {A: 1, B: 2}
 */
const mapKeys = <T extends GenericObject>(
	obj: T,
	fn: (key: keyof T, value: T[keyof T]) => string
): GenericObject => {
	const result: GenericObject = {};
	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			result[fn(key, obj[key])] = obj[key];
		}
	}
	return result;
};

export {
	isObject,
	isEmptyObject,
	deepClone,
	deepMerge,
	getNestedValue,
	setNestedValue,
	pick,
	omit,
	flattenObject,
	objectKeys,
	mapValues,
	mapKeys,
	type GenericObject,
};
