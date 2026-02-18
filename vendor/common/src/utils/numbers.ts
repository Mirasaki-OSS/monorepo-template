/**
 * Check if a number is an integer
 * @param n - Number to check
 * @returns True if number is an integer
 * @example isInt(5) // true, isInt(5.5) // false
 */
const isInt = (n: number): boolean => Number.isInteger(n);

/**
 * Check if a number is a float (has decimal places)
 * @param n - Number to check
 * @returns True if number is a float
 * @example isFloat(5.5) // true, isFloat(5) // false
 */
const isFloat = (n: number): boolean => !isInt(n);

/**
 * Check if a number is even
 * @param n - Number to check
 * @returns True if number is even
 * @example isEven(4) // true, isEven(5) // false
 */
const isEven = (n: number): boolean => n % 2 === 0;

/**
 * Check if a number is odd
 * @param n - Number to check
 * @returns True if number is odd
 * @example isOdd(5) // true, isOdd(4) // false
 */
const isOdd = (n: number): boolean => n % 2 !== 0;

/**
 * Round a number to a specific number of decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 * @example roundTo(3.14159, 2) // 3.14
 */
const roundTo = (value: number, decimals = 2): number => {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
};

/**
 * Clamp a number between min and max values
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 * @example clamp(15, 0, 10) // 10, clamp(-5, 0, 10) // 0
 */
const clamp = (value: number, min: number, max: number): number => {
	return Math.min(Math.max(value, min), max);
};

/**
 * Calculate percentage of a value relative to a total
 * @param value - The value
 * @param total - The total
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage (0-100)
 * @example percentage(25, 100) // 25, percentage(1, 3, 1) // 33.3
 */
const percentage = (value: number, total: number, decimals = 2): number => {
	if (total === 0) return 0;
	return roundTo((value / total) * 100, decimals);
};

/**
 * Calculate what value a percentage represents
 * @param percent - Percentage (0-100)
 * @param total - The total
 * @returns The value
 * @example percentageOf(25, 100) // 25, percentageOf(50, 200) // 100
 */
const percentageOf = (percent: number, total: number): number => {
	return (percent / 100) * total;
};

/**
 * Check if a number is within a range (inclusive)
 * @param value - Number to check
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if value is in range
 * @example inRange(5, 0, 10) // true, inRange(15, 0, 10) // false
 */
const inRange = (value: number, min: number, max: number): boolean => {
	return value >= min && value <= max;
};

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 * @example lerp(0, 100, 0.5) // 50, lerp(0, 100, 0.25) // 25
 */
const lerp = (start: number, end: number, t: number): number => {
	return start + (end - start) * t;
};

/**
 * Sum an array of numbers
 * @param values - Numbers to sum
 * @returns Sum of all values
 * @example sum([1, 2, 3, 4]) // 10
 */
const sum = (values: number[]): number => {
	return values.reduce((a, b) => a + b, 0);
};

/**
 * Get the average (mean) of an array of numbers
 * @param values - Numbers to average
 * @returns Average or null if empty
 * @example average([1, 2, 3, 4]) // 2.5
 */
const average = (values: number[]): number | null => calculateMean(values);

const INT32_MAX: number = 2 ** 31 - 1;
const INT32_MIN: number = -(2 ** 31);
const INT64_MAX: bigint = BigInt(2) ** BigInt(63) - BigInt(1);
const INT64_MIN: bigint = -(BigInt(2) ** BigInt(63));

/**
 * Calculate the mean (average) of an array of numbers
 * @param values - Numbers to calculate mean of
 * @returns Mean or null if empty
 * @example calculateMean([1, 2, 3, 4]) // 2.5
 */
const calculateMean = (values: number[]): number | null => {
	if (values.length === 0) return null;
	const sum = values.reduce((a, b) => a + b, 0);
	const average = sum / values.length;
	return average;
};

/**
 * Calculate the median (middle value) of an array of numbers
 * @param values - Numbers to calculate median of
 * @returns Median or null if empty
 * @example calculateMedian([1, 2, 3, 4, 5]) // 3
 */
const calculateMedian = (values: number[]): number | null => {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middleIndex = Math.floor(sorted.length / 2);
	const isEvenLength = isEven(sorted.length);
	if (isEvenLength) {
		const a = sorted[middleIndex] as number;
		const b = sorted[middleIndex - 1] as number;
		const average = (a + b) / 2;
		return average;
	} else {
		if (sorted.length === 1) return sorted[0] as number;
		const median = sorted[middleIndex] as number;
		return median;
	}
};

/**
 * Calculate the variance of an array of numbers
 * @param values - Numbers to calculate variance of
 * @returns Variance or null if empty
 * @example calculateVariance([2, 4, 6, 8]) // 5
 */
const calculateVariance = (values: number[]): number | null => {
	if (values.length === 0) return null;
	const mean = calculateMean(values);
	if (typeof mean !== 'number') return null;
	const squaredDifferences = values.map((value) => (value - mean) ** 2);
	const variance = calculateMean(squaredDifferences);
	return variance;
};

/**
 * Calculate the standard deviation of an array of numbers
 * @param values - Numbers to calculate standard deviation of
 * @returns Standard deviation or null if empty
 * @example calculateStandardDeviation([2, 4, 6, 8]) // ~2.24
 */
const calculateStandardDeviation = (values: number[]): number | null => {
	const variance = calculateVariance(values);
	if (typeof variance !== 'number') return null;
	return Math.sqrt(variance);
};

/**
 * Helper for JSON.stringify to handle BigInt serialization
 * Converts large bigints to strings and small ones to numbers
 * @param _ - Key (unused)
 * @param value - Value to serialize
 * @returns Serializable value
 * @example JSON.stringify({big: 9007199254740992n}, bigIntSerializationHelper)
 */
const bigIntSerializationHelper = (_: string, value: unknown): unknown =>
	typeof value === 'bigint'
		? value > BigInt(Number.MAX_SAFE_INTEGER)
			? value.toString() // Convert large bigints to strings
			: Number(value) // Convert small/safe bigints to numbers
		: value; // Return other values as is

export {
	isInt,
	isFloat,
	isEven,
	isOdd,
	roundTo,
	clamp,
	percentage,
	percentageOf,
	inRange,
	lerp,
	sum,
	average,
	INT32_MAX,
	INT32_MIN,
	INT64_MAX,
	INT64_MIN,
	calculateMean,
	calculateMedian,
	calculateVariance,
	calculateStandardDeviation,
	bigIntSerializationHelper,
};
