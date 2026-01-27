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

export {
	isObject,
	isEmptyObject,
	deepClone,
	deepMerge,
	getNestedValue,
	type GenericObject,
	type ObjectChange,
};
