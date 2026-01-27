import { TimeMagic } from '../constants/time';

const unix = (timestamp: number): number =>
	Math.floor(timestamp / TimeMagic.MILLISECONDS_PER_SECOND);

const unixNow = (): number => unix(Date.now());

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

const hrTimeToMs = (hrTime: [number, number]): number =>
	hrTime[0] * 1e3 + hrTime[1] / 1e6;

const bigIntDurationToHumanReadable = (start: bigint): string => {
	const end = process.hrtime.bigint();
	const ms = Number(end - start) / 1e6;
	return `${ms.toFixed(3)}ms`;
};

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
