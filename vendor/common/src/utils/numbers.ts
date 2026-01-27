const isInt = (n: number): boolean => Number.isInteger(n);
const isFloat = (n: number): boolean => !isInt(n);
const isEven = (n: number): boolean => n % 2 === 0;
const isOdd = (n: number): boolean => n % 2 !== 0;

const INT32_MAX: number = 2 ** 31 - 1;
const INT32_MIN: number = -(2 ** 31);
const INT64_MAX: bigint = BigInt(2) ** BigInt(63) - BigInt(1);
const INT64_MIN: bigint = -(BigInt(2) ** BigInt(63));

const calculateMean = (values: number[]): number | null => {
	if (values.length === 0) return null;
	const sum = values.reduce((a, b) => a + b, 0);
	const average = sum / values.length;
	return average;
};

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

const calculateVariance = (values: number[]): number | null => {
	if (values.length === 0) return null;
	const mean = calculateMean(values);
	if (typeof mean !== 'number') return null;
	const squaredDifferences = values.map((value) => (value - mean) ** 2);
	const variance = calculateMean(squaredDifferences);
	return variance;
};

const calculateStandardDeviation = (values: number[]): number | null => {
	const variance = calculateVariance(values);
	if (typeof variance !== 'number') return null;
	return Math.sqrt(variance);
};

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
