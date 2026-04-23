import { TimeMagic } from '../constants/time';
import { DEFAULT_LOCALE, DEFAULT_NULL_DISPLAY } from '../defaults';

/**
 * Convert a timestamp in milliseconds to Unix timestamp (seconds)
 * @param timestamp - Timestamp in milliseconds
 * @returns Unix timestamp in seconds
 * @example unix(1609459200000) // 1609459200
 */
const unix = (timestamp: number): number =>
	Math.floor(timestamp / TimeMagic.MILLISECONDS_PER_SECOND);

/**
 * Get current Unix timestamp in seconds
 * @returns Current Unix timestamp
 * @example unixNow() // Current time in seconds
 */
const unixNow = (): number => unix(Date.now());

const toMillis = (value: Date | string | null | undefined): number => {
	if (!value) {
		return 0;
	}

	const date = value instanceof Date ? value : new Date(value);
	const time = date.getTime();
	return Number.isNaN(time) ? 0 : time;
};

const toUnix = (value: Date | string | null | undefined): number | null => {
	const milliseconds = toMillis(value);
	return milliseconds > 0
		? Math.floor(milliseconds / TimeMagic.MILLISECONDS_PER_SECOND)
		: null;
};

const toDateFromUnixSeconds = (unixSeconds?: number | null): Date | null =>
	typeof unixSeconds === 'number' && unixSeconds > 0
		? new Date(unixSeconds * TimeMagic.MILLISECONDS_PER_SECOND)
		: null;

/**
 * Convert milliseconds to human readable format
 * @param ms - Milliseconds to format
 * @param maxParts - Maximum number of time parts to show (default: 2)
 * @param msDisplay - What to display for very small values (default: "Just now")
 * @returns Human readable string
 * @example humanReadableMs(90000) // "1 minute and 30 seconds"
 * @example humanReadableMs(3600000, 1) // "1 hour"
 */
const humanReadableMs = (
	ms: number,
	maxParts = 2,
	msDisplay: string | ((ms: number) => string) = 'Just now'
): string => {
	const days = (ms / TimeMagic.MILLISECONDS_PER_DAY) | 0;
	const hours =
		((ms % TimeMagic.MILLISECONDS_PER_DAY) / TimeMagic.MILLISECONDS_PER_HOUR) |
		0;
	const minutes =
		((ms % TimeMagic.MILLISECONDS_PER_HOUR) /
			TimeMagic.MILLISECONDS_PER_MINUTE) |
		0;
	const seconds =
		((ms % TimeMagic.MILLISECONDS_PER_MINUTE) /
			TimeMagic.MILLISECONDS_PER_SECOND) |
		0;

	const parts = [];
	if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
	if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
	if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
	if (seconds > 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);

	const formattedParts = parts.slice(0, maxParts);
	const lastPart = formattedParts.pop();

	if (formattedParts.length > 0) {
		return `${formattedParts.join(', ')}${formattedParts.length > 1 ? ',' : ''} and ${lastPart}`;
	} else
		return (
			lastPart ?? (typeof msDisplay === 'function' ? msDisplay(ms) : msDisplay)
		);
};

/**
 * Convert high-resolution time to milliseconds
 * @param hrTime - High-resolution time tuple [seconds, nanoseconds]
 * @returns Time in milliseconds
 * @example hrTimeToMs([1, 500000000]) // 1500 (1.5 seconds)
 */
const hrTimeToMs = (hrTime: [number, number]): number =>
	hrTime[0] * 1e3 + hrTime[1] / 1e6;

/**
 * Convert BigInt duration to human readable string
 * @param start - Start time from process.hrtime.bigint()
 * @returns Human readable duration string
 * @example bigIntDurationToHumanReadable(startTime) // "123.456ms"
 */
const bigIntDurationToHumanReadable = (start: bigint): string => {
	const end = process.hrtime.bigint();
	const ms = Number(end - start) / 1e6;
	return `${ms.toFixed(3)}ms`;
};

/**
 * Calculate average occurrences per interval from an array of dates
 * @param dates - Array of dates
 * @param interval - Interval in milliseconds
 * @returns Average number of occurrences per interval
 * @example occurrencesPerInterval([date1, date2, date3], 60000) // Avg per minute
 */
const occurrencesPerInterval = (dates: Date[], interval: number): number => {
	const firstDate = dates[0];

	if (typeof firstDate === 'undefined') {
		return 0;
	}

	let totalCount = 0;
	let intervalCount = 0;
	const map: Record<string, number> = {};
	const baseTime = firstDate.getTime();

	// Iterate through the dates and count them in their respective intervals
	for (const date of dates) {
		const timeDiff = date.getTime() - baseTime;
		const intervalIndex = Math.floor(timeDiff / interval);

		if (map[intervalIndex]) {
			map[intervalIndex]++;
		} else {
			map[intervalIndex] = 1;
		}
	}

	// Calculate the total count and number of intervals
	for (const key in map) {
		const val = map[key];
		if (!val) continue;
		totalCount += val;
		intervalCount++;
	}

	// Calculate the average
	return totalCount / intervalCount;
};

// ===================================================================
// Start Date Formatters
// ===================================================================

const DATE_FORMATTER = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
});

type FormatDateRelativeOptions = {
	maxParts?: number;
};

type FormatIntervalOptions = {
	nullDisplay?: string;
	prefix?: string;
};

type RelativeTimeUnit = {
	label: string;
	seconds: number;
	isApproximate?: boolean;
};

const RELATIVE_TIME_UNITS: readonly RelativeTimeUnit[] = [
	{ label: 'year', seconds: 365 * 24 * 60 * 60, isApproximate: true },
	{ label: 'month', seconds: 30 * 24 * 60 * 60, isApproximate: true },
	{ label: 'week', seconds: 7 * 24 * 60 * 60 },
	{ label: 'day', seconds: 24 * 60 * 60 },
	{ label: 'hour', seconds: 60 * 60 },
	{ label: 'minute', seconds: 60 },
	{ label: 'second', seconds: 1 },
];

const toDate = (value: string | Date) =>
	typeof value === 'string' ? new Date(value) : value;

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const formatRelativeUnit = (value: number, label: string) =>
	`${value} ${label}${value === 1 ? '' : 's'}`;

const formatInterval = (
	interval: string | null | undefined,
	intervalCount = 1,
	options: FormatIntervalOptions = {}
) => {
	const nullDisplay = options.nullDisplay ?? DEFAULT_NULL_DISPLAY;
	if (!interval) {
		return nullDisplay;
	}

	const normalizedInterval = interval.trim().toLowerCase();
	if (!normalizedInterval) {
		return nullDisplay;
	}

	const safeIntervalCount = Math.max(1, Math.floor(intervalCount));
	const prefix = options.prefix ?? 'Every';

	if (safeIntervalCount === 1) {
		return `${prefix} ${normalizedInterval}`;
	}

	return `${prefix} ${safeIntervalCount} ${normalizedInterval}s`;
};

function formatDate(date: string | Date): string;
function formatDate(date: null): typeof DEFAULT_NULL_DISPLAY;
function formatDate<TDisplayNull extends string>(
	date: null,
	displayNull: TDisplayNull
): TDisplayNull;
function formatDate<TDisplayNull extends string = typeof DEFAULT_NULL_DISPLAY>(
	date: string | Date | null,
	displayNull?: TDisplayNull
): string;
function formatDate<TDisplayNull extends string = typeof DEFAULT_NULL_DISPLAY>(
	date: string | Date | null,
	displayNull?: TDisplayNull
): string {
	const nullDisplay = displayNull ?? (DEFAULT_NULL_DISPLAY as TDisplayNull);

	if (date === null) {
		return nullDisplay;
	}

	const dateObj = toDate(date);
	if (!isValidDate(dateObj)) {
		return nullDisplay;
	}

	return DATE_FORMATTER.format(dateObj);
}

const formatDateRelative = (
	date: string | Date | null,
	options: FormatDateRelativeOptions = {}
) => {
	if (date === null) {
		return DEFAULT_NULL_DISPLAY;
	}

	const dateObj = toDate(date);

	if (!isValidDate(dateObj)) {
		return DEFAULT_NULL_DISPLAY;
	}

	const now = new Date();
	const diffMs = now.getTime() - dateObj.getTime();
	const isFuture = diffMs < 0;
	let remainingSeconds = Math.floor(Math.abs(diffMs) / 1000);

	const normalizedMaxParts = Math.max(1, Math.floor(options.maxParts ?? 2));

	const parts: string[] = [];

	let isApproximate = false;

	for (const unit of RELATIVE_TIME_UNITS) {
		if (parts.length >= normalizedMaxParts) {
			break;
		}

		const value = Math.floor(remainingSeconds / unit.seconds);
		if (value <= 0) {
			continue;
		}

		if (unit.isApproximate) {
			isApproximate = true;
		}

		parts.push(formatRelativeUnit(value, unit.label));
		remainingSeconds -= value * unit.seconds;
	}

	if (parts.length === 0) {
		parts.push(formatRelativeUnit(0, 'second'));
	}

	const relativeText = parts.join(', ');
	return isFuture
		? `in${isApproximate ? ' about' : ''} ${relativeText}`
		: `${isApproximate ? 'about ' : ''}${relativeText} ago`;
};

export {
	bigIntDurationToHumanReadable,
	DATE_FORMATTER,
	DEFAULT_LOCALE,
	DEFAULT_NULL_DISPLAY,
	type FormatDateRelativeOptions,
	type FormatIntervalOptions,
	formatDate,
	formatDateRelative,
	formatInterval,
	hrTimeToMs,
	humanReadableMs,
	occurrencesPerInterval,
	RELATIVE_TIME_UNITS,
	type RelativeTimeUnit,
	TimeMagic,
	toDateFromUnixSeconds,
	toMillis,
	toUnix,
	unix,
	unixNow,
};
