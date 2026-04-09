const isInt = (n: number): boolean => Number.isInteger(n);
const isFloat = (n: number): boolean => !isInt(n);
const isEven = (n: number): boolean => n % 2 === 0;
const isOdd = (n: number): boolean => n % 2 !== 0;

const precisionModes = ['round', 'floor', 'ceil', 'trunc'] as const;
type PrecisionMode = (typeof precisionModes)[number];

type PrecisionOptions = {
	precision?: number;
	mode?: PrecisionMode;
};

const PRECISION_DEFAULT = 2;
const PRECISION_MIN = 0;
const PRECISION_MAX = 100;

const normalizePrecision = (precision?: number): number => {
	if (typeof precision !== 'number' || Number.isNaN(precision)) {
		return PRECISION_DEFAULT;
	}

	return Math.min(
		PRECISION_MAX,
		Math.max(PRECISION_MIN, Math.floor(precision))
	);
};

const isPrecisionMode = (mode: unknown): mode is PrecisionMode =>
	typeof mode === 'string' && precisionModes.includes(mode as PrecisionMode);

const getPrecisionMode = (mode?: unknown): PrecisionMode =>
	isPrecisionMode(mode) ? mode : 'round';

const toPrecision = (num: number, options: PrecisionOptions = {}): number => {
	if (!Number.isFinite(num)) {
		return num;
	}

	const precision = normalizePrecision(options.precision);
	const mode = getPrecisionMode(options.mode);
	const factor = 10 ** precision;
	const scaled = num * factor;
	const epsilonAdjusted = scaled + Number.EPSILON * Math.sign(scaled || 1);

	switch (mode) {
		case 'floor':
			return Math.floor(epsilonAdjusted) / factor;
		case 'ceil':
			return Math.ceil(epsilonAdjusted) / factor;
		case 'trunc':
			return Math.trunc(epsilonAdjusted) / factor;
		case 'round':
			return Math.round(epsilonAdjusted) / factor;
		default:
			throw new Error(`Unsupported precision mode: ${mode}`);
	}
};

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

export type { PrecisionMode, PrecisionOptions };
export {
	bigIntSerializationHelper,
	calculateMean,
	calculateMedian,
	calculateStandardDeviation,
	calculateVariance,
	INT32_MAX,
	INT32_MIN,
	INT64_MAX,
	INT64_MIN,
	isEven,
	isFloat,
	isInt,
	isOdd,
	isPrecisionMode,
	normalizePrecision,
	precisionModes,
	toPrecision,
};
