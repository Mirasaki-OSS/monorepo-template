type GenericObject = Record<string, unknown>;
type ObjectChange = {
	path: string[];
	previousValue: unknown;
	newValue: unknown;
};

const isObject = (item: unknown): item is GenericObject =>
	typeof item === 'object' && item !== null;

const isEmptyObject = (item: unknown): item is GenericObject =>
	isObject(item) && Object.keys(item).length === 0;

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

const formatObjectPath = (key: string): string => {
	return key
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

const getValueAtPath = <R = unknown>(
	obj: unknown,
	path: string[]
): R | undefined => {
	let current: unknown = obj;
	for (const key of path) {
		if (!current || typeof current !== 'object' || !(key in current)) {
			return undefined;
		}
		current = (current as Record<string, unknown>)[key];
	}
	return current as R;
};

const setValueAtPath = (
	obj: Record<string, unknown>,
	path: string[],
	value: unknown
) => {
	const next = { ...obj };
	let cursor: Record<string, unknown> = next;

	for (let i = 0; i < path.length - 1; i++) {
		const key = path[i];
		const current = cursor[key];
		if (!current || typeof current !== 'object' || Array.isArray(current)) {
			cursor[key] = {};
		}
		cursor = cursor[key] as Record<string, unknown>;
	}

	const leafKey = path[path.length - 1];
	if (value === undefined) {
		delete cursor[leafKey];
	} else {
		cursor[leafKey] = value;
	}

	return next;
};

const getStringAtPath = (value: unknown, ...path: string[]): string | null => {
	const nestedValue = getValueAtPath(value, path);
	return typeof nestedValue === 'string' ? nestedValue : null;
};

const getNumberAtPath = (value: unknown, ...path: string[]): number | null => {
	const nestedValue = getValueAtPath(value, path);
	return typeof nestedValue === 'number' && Number.isFinite(nestedValue)
		? nestedValue
		: null;
};

const getBooleanAtPath = (
	value: unknown,
	...path: string[]
): boolean | null => {
	const nestedValue = getValueAtPath(value, path);
	return typeof nestedValue === 'boolean' ? nestedValue : null;
};

const getArrayAtPath = (value: unknown, ...path: string[]): unknown[] => {
	const nestedValue = getValueAtPath(value, path);
	return Array.isArray(nestedValue) ? nestedValue : [];
};

export {
	deepClone,
	deepMerge,
	formatObjectPath,
	type GenericObject,
	getArrayAtPath,
	getBooleanAtPath,
	getNumberAtPath,
	getStringAtPath,
	getValueAtPath,
	isEmptyObject,
	isObject,
	type ObjectChange,
	setValueAtPath,
};
