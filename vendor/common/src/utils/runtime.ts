import { INT32_MAX } from './numbers';
import { TimeMagic } from './time';

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 * @example await sleep(1000) // Sleep for 1 second
 */
const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sleep until a condition becomes true
 * @param condition - Function that returns true when ready to continue
 * @param interval - How often to check the condition in ms (default: 1000)
 * @returns Promise that resolves when condition is true
 * @example await sleepUntil(() => dataLoaded, 500)
 */
const sleepUntil = async (
	condition: () => boolean | Promise<boolean>,
	interval: number = TimeMagic.MILLISECONDS_PER_SECOND
): Promise<void> => {
	while (!(await condition())) await sleep(interval);
};

/**
 * Sleep until a condition becomes true or timeout is reached
 * @param condition - Function that returns true when ready to continue
 * @param timeout - Maximum time to wait in ms
 * @param interval - How often to check the condition in ms (default: 1000)
 * @returns Promise that resolves when condition is true or timeout is reached
 * @example await sleepUntilOrTimeout(() => dataLoaded, 5000, 500)
 */
const sleepUntilOrTimeout = async (
	condition: () => boolean | Promise<boolean>,
	timeout: number,
	interval: number = TimeMagic.MILLISECONDS_PER_SECOND
): Promise<void> => {
	const start = Date.now();
	while (!(await condition()) && Date.now() - start < timeout)
		await sleep(interval);
};

/**
 * Race a promise against a timeout
 * @param promise - Promise to await
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves with the value or rejects on timeout
 * @example await awaitOrTimeout(fetchData(), 5000)
 */
const awaitOrTimeout = <T>(
	promise: Promise<T>,
	timeout: number
): Promise<T> => {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Promise timed out after ${timeout}ms`));
		}, timeout);

		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(reason) => {
				clearTimeout(timer);
				reject(reason);
			}
		);
	});
};

/**
 * Safely set a timeout that handles values larger than INT32_MAX
 * @param timeoutMs - Timeout in milliseconds
 * @param scheduleOverflowInFuture - Whether to schedule overflow timeouts automatically
 * @param fn - Function to execute
 * @param onNewTimeout - Callback when a new timeout is scheduled
 * @returns Timeout handle
 * @example safeSetTimeout(2147483648, true, () => console.log('Done'))
 */
const safeSetTimeout = (
	timeoutMs: number,
	scheduleOverflowInFuture: boolean,
	fn: () => void,
	onNewTimeout?: (timeout: NodeJS.Timeout, isTimeoutForRunFn: boolean) => void
): NodeJS.Timeout => {
	if (timeoutMs < 0) {
		throw new Error('Timeout value is negative');
	}

	const isSafe = timeoutMs <= INT32_MAX;

	if (!isSafe && !scheduleOverflowInFuture) {
		throw new Error(
			"Timeout value is too large, as it doesn't fit in an int32"
		);
	}

	if (isSafe) {
		return setTimeout(fn, timeoutMs);
	}

	const scheduleTimeout = (_timeoutMs: number): NodeJS.Timeout => {
		let timeout: NodeJS.Timeout;
		let isTimeoutForRunFn = false;

		if (_timeoutMs > INT32_MAX) {
			timeout = setTimeout(() => {
				scheduleTimeout(_timeoutMs - INT32_MAX);
			}, INT32_MAX);
		} else {
			isTimeoutForRunFn = true;
			timeout = setTimeout(() => {
				fn();
			}, _timeoutMs);
		}

		if (timeoutMs !== _timeoutMs) {
			onNewTimeout?.(timeout, isTimeoutForRunFn);
		}

		return timeout;
	};

	return scheduleTimeout(timeoutMs);
};

/**
 * Safely set an interval that handles values larger than INT32_MAX
 * @param intervalMs - Interval in milliseconds
 * @param fn - Function to execute
 * @param onNewTimeout - Callback when a new timeout is scheduled
 * @returns Timeout handle
 * @example safeSetInterval(2147483648, () => console.log('Tick'))
 */
const safeSetInterval = (
	intervalMs: number,
	fn: () => void,
	onNewTimeout?: (timeout: NodeJS.Timeout, isTimeoutForRunFn: boolean) => void
): NodeJS.Timeout => {
	return safeSetTimeout(
		intervalMs,
		true,
		() => {
			fn();
			safeSetInterval(intervalMs, fn, onNewTimeout);
		},
		onNewTimeout
	);
};

/**
 * Safely set an async interval that handles values larger than INT32_MAX
 * @param intervalMs - Interval in milliseconds
 * @param fn - Async function to execute
 * @param onNewTimeout - Callback when a new timeout is scheduled
 * @returns Timeout handle
 * @example safeSetAsyncInterval(2147483648, async () => await doWork())
 */
const safeSetAsyncInterval = (
	intervalMs: number,
	fn: () => Promise<void>,
	onNewTimeout?: (timeout: NodeJS.Timeout, isTimeoutForRunFn: boolean) => void
): NodeJS.Timeout => {
	return safeSetTimeout(
		intervalMs,
		true,
		async () => {
			await fn();
			safeSetAsyncInterval(intervalMs, fn, onNewTimeout);
		},
		onNewTimeout
	);
};

export {
	sleep,
	sleepUntil,
	sleepUntilOrTimeout,
	awaitOrTimeout,
	safeSetTimeout,
	safeSetInterval,
	safeSetAsyncInterval,
};
