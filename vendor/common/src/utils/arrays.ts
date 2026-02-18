import { truncate } from './strings';

/**
 * Split an array into chunks of specified size
 * @param arr - The array to chunk
 * @param size - The size of each chunk
 * @returns Array of chunks
 * @example chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
const chunk = <T>(arr: T[], size: number): T[][] => {
	const result = [];

	if (size <= 0) {
		throw new Error('Chunk size must be greater than 0');
	}

	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, size + i));
	}

	return result;
};

/**
 * Get unique values from an array
 * @param arr - The array to filter
 * @returns Array with unique values
 * @example unique([1, 2, 2, 3, 3, 3]) // [1, 2, 3]
 */
const unique = <T>(arr: T[]): T[] => [...new Set(arr)];

/**
 * Get unique values from an array based on a key function
 * @param arr - The array to filter
 * @param keyFn - Function to extract the unique key from each element
 * @returns Array with unique values based on key
 * @example uniqueBy([{id: 1}, {id: 2}, {id: 1}], x => x.id) // [{id: 1}, {id: 2}]
 */
const uniqueBy = <T, K>(arr: T[], keyFn: (item: T) => K): T[] => {
	const seen = new Set<K>();
	return arr.filter((item) => {
		const key = keyFn(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

/**
 * Flatten an array of arrays one level deep
 * @param arr - The array to flatten
 * @returns Flattened array
 * @example flatten([[1, 2], [3, 4]]) // [1, 2, 3, 4]
 */
const flatten = <T>(arr: T[][]): T[] => arr.flat();

/**
 * Flatten an array of arrays recursively
 * @param arr - The array to flatten
 * @returns Deeply flattened array
 * @example flattenDeep([[1, [2]], [3, [4, [5]]]]) // [1, 2, 3, 4, 5]
 */
const flattenDeep = (arr: unknown[]): unknown[] => {
	return arr.reduce<unknown[]>((acc, val) => {
		return Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val);
	}, []);
};

/**
 * Get the difference between two arrays (items in first but not in second)
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Array of items in arr1 but not in arr2
 * @example difference([1, 2, 3], [2, 3, 4]) // [1]
 */
const difference = <T>(arr1: T[], arr2: T[]): T[] => {
	const set2 = new Set(arr2);
	return arr1.filter((item) => !set2.has(item));
};

/**
 * Get the intersection of two arrays (items common to both)
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Array of items in both arrays
 * @example intersection([1, 2, 3], [2, 3, 4]) // [2, 3]
 */
const intersection = <T>(arr1: T[], arr2: T[]): T[] => {
	const set2 = new Set(arr2);
	return arr1.filter((item) => set2.has(item));
};

/**
 * Get the union of two arrays (all unique items from both)
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Array of all unique items
 * @example union([1, 2], [2, 3]) // [1, 2, 3]
 */
const union = <T>(arr1: T[], arr2: T[]): T[] => unique([...arr1, ...arr2]);

/**
 * Shuffle an array randomly
 * @param arr - The array to shuffle
 * @returns New shuffled array
 * @example shuffle([1, 2, 3, 4]) // [3, 1, 4, 2] (random order)
 */
const shuffle = <T>(arr: T[]): T[] => {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
};

/**
 * Partition an array into two arrays based on a predicate
 * @param arr - The array to partition
 * @param predicate - Function to test each element
 * @returns Tuple of [passing, failing] arrays
 * @example partition([1, 2, 3, 4], x => x % 2 === 0) // [[2, 4], [1, 3]]
 */
const partition = <T>(
	arr: T[],
	predicate: (item: T) => boolean
): [T[], T[]] => {
	const pass: T[] = [];
	const fail: T[] = [];
	for (const item of arr) {
		if (predicate(item)) pass.push(item);
		else fail.push(item);
	}
	return [pass, fail];
};

/**
 * Group array elements by a key function
 * @param arr - The array to group
 * @param keyFn - Function to extract the group key
 * @returns Object with keys and arrays of matching items
 * @example groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}, {type: 'a', val: 3}], x => x.type)
 * // {a: [{type: 'a', val: 1}, {type: 'a', val: 3}], b: [{type: 'b', val: 2}]}
 */
const groupBy = <T, K extends string | number | symbol>(
	arr: T[],
	keyFn: (item: T) => K
): Record<K, T[]> => {
	return arr.reduce(
		(acc, item) => {
			const key = keyFn(item);
			if (!acc[key]) acc[key] = [];
			acc[key].push(item);
			return acc;
		},
		{} as Record<K, T[]>
	);
};

/**
 * Join array items into a string with various options
 * @param arr - The array to join
 * @param options - Join options (separator, max items, max length, etc.)
 * @returns Joined string
 */
const join = <T extends unknown[]>(
	arr: T,
	options: JoinOptions = {}
): string => {
	let output: string;
	const {
		maxItems = -1,
		maxLength = -1,
		emptyOutput = 'None',
		joinString = ', ',
	} = options;

	const withMaxLength = (str: string) => {
		if (maxLength === -1) return str;
		return str.length > maxLength ? truncate(str, maxLength) : str;
	};

	if (arr.length === 0) output = emptyOutput;
	else if (arr.length <= maxItems || maxItems === -1) {
		output = arr.join(joinString);
	} else {
		const includedItems = arr.slice(0, maxItems);
		const excludedItemsCount = arr.length - maxItems;
		const excludedItemsMessage = `and ${excludedItemsCount} more...`;

		output = `${includedItems.join(joinString)}, ${excludedItemsMessage}`;
	}

	return withMaxLength(output);
};

/**
 * Type guard to check if all items in array are strings
 * @param arr - The array to check
 * @returns True if all items are strings
 */
const isStringArray = (arr: unknown[]): arr is string[] =>
	arr.every((item) => typeof item === 'string');

/**
 * Type guard to check if all items in array are numbers
 * @param arr - The array to check
 * @returns True if all items are numbers
 */
const isNumberArray = (arr: unknown[]): arr is number[] =>
	arr.every((item) => typeof item === 'number');

/**
 * Type guard to check if all items in array are booleans
 * @param arr - The array to check
 * @returns True if all items are booleans
 */
const isBooleanArray = (arr: unknown[]): arr is boolean[] =>
	arr.every((item) => typeof item === 'boolean');

/**
 * Type guard to check if all items in array are objects
 * @param arr - The array to check
 * @returns True if all items are objects
 */
const isObjectArray = (arr: unknown[]): arr is Record<string, unknown>[] =>
	arr.every((item) => typeof item === 'object' && item !== null);

type JoinOptions = {
	/**
	 * The string to join the items with
	 * @default ', '
	 */
	joinString?: string;
	/**
	 * The maximum number of (array) items to include
	 * @default -1
	 */
	maxItems?: number;
	/**
	 * The maximum length of the joined/final string
	 * @default -1
	 */
	maxLength?: number;
	/**
	 * The string that is returned if the input array is empty
	 * @default 'None'
	 */
	emptyOutput?: string;
};

export {
	chunk,
	unique,
	uniqueBy,
	flatten,
	flattenDeep,
	difference,
	intersection,
	union,
	shuffle,
	partition,
	groupBy,
	join,
	isStringArray,
	isNumberArray,
	isBooleanArray,
	isObjectArray,
	type JoinOptions,
};
