import { TimeMagic } from '../constants/time';

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
	if (dates.length === 0) return 0;

	let totalCount = 0;
	let intervalCount = 0;
	const map: Record<string, number> = {};
	const baseTime = dates[0].getTime();

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

export {
	unix,
	unixNow,
	humanReadableMs,
	hrTimeToMs,
	bigIntDurationToHumanReadable,
	occurrencesPerInterval,
	TimeMagic,
};
