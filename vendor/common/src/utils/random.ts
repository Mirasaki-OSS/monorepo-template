/**
 * Generate a random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 * @example randomInt(1, 10) // Random integer from 1 to 10
 */
const randomInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate a random float between min and max
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random float
 * @example randomFloat(1.0, 10.0) // Random float from 1.0 to 10.0
 */
const randomFloat = (min: number, max: number): number =>
	Math.random() * (max - min) + min;

/**
 * Get a random item from an array
 * @param items - Array to pick from
 * @returns Random item or undefined if array is empty
 * @example randomItem([1, 2, 3]) // Could return 1, 2, or 3
 */
const randomItem = <T>(items: T[]): T | undefined =>
	items[Math.floor(Math.random() * items.length)];

/**
 * Get a random key from an object or array
 * @param items - Object or array to pick from
 * @returns Random key or undefined
 * @example randomKey({a: 1, b: 2}) // Could return "a" or "b"
 */
const randomKey = <T>(items: Record<string, T> | T[]): string | undefined =>
	randomItem(Object.keys(items));

/**
 * Get a random value from an object or array
 * @param items - Object or array to pick from
 * @returns Random value or undefined
 * @example randomValue({a: 1, b: 2}) // Could return 1 or 2
 */
const randomValue = <T>(items: Record<string, T> | T[]): T | undefined =>
	randomItem(Array.isArray(items) ? items : Object.values(items));

/**
 * Generate a random boolean value
 * @returns Random true or false
 * @example randomBoolean() // Could return true or false with 50% probability each
 */
const randomBoolean = (): boolean => Math.random() < 0.5;

/**
 * Generate a random string of specified length
 * @param length - Length of the string to generate
 * @param characters - Character set to use (string or options object)
 * @returns Random string
 * @example randomString(10) // Random 10-char string with uppercase, lowercase, and numbers
 * @example randomString(5, 'abc') // Random 5-char string using only 'a', 'b', 'c'
 * @example randomString(8, {useUppercase: true, useLowercase: false, useNumeric: false})
 */
const randomString = (
	length: number,
	characters?: string | RandomStringOptions
): string => {
	const resolveCharactersFromOptions = (options: RandomStringOptions = {}) => {
		// Default to all character types if none specified
		const hasAnyOption =
			options.useUppercase !== undefined ||
			options.useLowercase !== undefined ||
			options.useNumeric !== undefined;

		return [
			(options.useUppercase ?? !hasAnyOption)
				? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
				: '',
			(options.useLowercase ?? !hasAnyOption)
				? 'abcdefghijklmnopqrstuvwxyz'
				: '',
			(options.useNumeric ?? !hasAnyOption) ? '0123456789' : '',
		].join('');
	};

	const resolvedCharacters =
		typeof characters === 'string'
			? characters
			: resolveCharactersFromOptions(characters);

	if (resolvedCharacters.length === 0 && length > 0) {
		throw new Error('Character set cannot be empty');
	}

	if (length <= 0) return '';

	return Array.from({ length })
		.map(() =>
			resolvedCharacters.charAt(randomInt(0, resolvedCharacters.length - 1))
		)
		.join('');
};

/**
 * Generate a random hex string (lowercase)
 * @param length - Length of the hex string (default: 16)
 * @returns Random hex string
 * @example randomHex(8) // "a3f5c9d1"
 */
const randomHex = (length = 16): string => {
	return randomString(length, '0123456789abcdef');
};

/**
 * Generate a UUID v4 (random)
 * @returns UUID string
 * @example randomUUID() // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 */
const randomUUID = (): string => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

/**
 * Pick N random items from an array without replacement
 * @param items - Array to sample from
 * @param count - Number of items to pick
 * @returns Array of randomly selected items
 * @example sample([1, 2, 3, 4, 5], 3) // [2, 5, 1]
 */
const sample = <T>(items: T[], count: number): T[] => {
	if (count > items.length) {
		throw new Error(
			`Cannot sample ${count} items from array of length ${items.length}`
		);
	}
	if (count <= 0) return [];

	const result: T[] = [];
	const copy = [...items];

	for (let i = 0; i < count; i++) {
		const index = randomInt(0, copy.length - 1);
		result.push(copy[index]);
		copy.splice(index, 1);
	}

	return result;
};

/**
 * Pick a random item with weighted probabilities
 * @param items - Array of items
 * @param weights - Array of weights (must be same length as items)
 * @returns Random item based on weights
 * @example weightedRandom(['a', 'b', 'c'], [1, 2, 3]) // 'c' is 3x more likely than 'a'
 */
const weightedRandom = <T>(items: T[], weights: number[]): T | undefined => {
	if (items.length === 0) return undefined;
	if (items.length !== weights.length) {
		throw new Error('Items and weights arrays must have the same length');
	}

	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
	if (totalWeight <= 0) {
		throw new Error('Total weight must be greater than 0');
	}

	let random = Math.random() * totalWeight;

	for (let i = 0; i < items.length; i++) {
		random -= weights[i];
		if (random <= 0) {
			return items[i];
		}
	}

	// Fallback (should never reach here)
	return items[items.length - 1];
};

/**
 * Get a random enum value
 * @param enumObj - Enum object
 * @returns Random enum value
 * @example enum Color { Red, Green, Blue }; randomEnum(Color) // Color.Green
 */
const randomEnum = <T extends Record<string, string | number>>(
	enumObj: T
): T[keyof T] => {
	// Filter out numeric keys (reverse mappings in numeric enums)
	const enumValues = Object.keys(enumObj)
		.filter((key) => Number.isNaN(Number(key)))
		.map((key) => enumObj[key]);

	return randomItem(enumValues as T[keyof T][]) as T[keyof T];
};

/**
 * Generate a random hex color
 * @returns Random hex color string (e.g., "#a3f5c9")
 * @example randomColor() // "#a3f5c9"
 */
const randomColor = (): string => {
	return `#${randomHex(6)}`;
};

/**
 * Generate a random date between two dates
 * @param start - Start date
 * @param end - End date
 * @returns Random date between start and end
 * @example randomDate(new Date(2020, 0, 1), new Date(2021, 0, 1))
 */
const randomDate = (start: Date, end: Date): Date => {
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime())
	);
};

type RandomStringOptions = {
	useNumeric?: boolean;
	useLowercase?: boolean;
	useUppercase?: boolean;
};

export {
	randomInt,
	randomFloat,
	randomItem,
	randomKey,
	randomValue,
	randomBoolean,
	randomString,
	randomHex,
	randomUUID,
	sample,
	weightedRandom,
	randomEnum,
	randomColor,
	randomDate,
	type RandomStringOptions,
};
