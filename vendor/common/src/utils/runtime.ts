import { INT32_MAX } from './numbers';
import { TimeMagic } from './time';

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

const sleepUntil = async (
	condition: () => boolean | Promise<boolean>,
	interval: number = TimeMagic.MILLISECONDS_PER_SECOND
): Promise<void> => {
	while (!(await condition())) await sleep(interval);
};

const sleepUntilOrTimeout = async (
	condition: () => boolean | Promise<boolean>,
	timeout: number,
	interval: number = TimeMagic.MILLISECONDS_PER_SECOND
): Promise<void> => {
	const start = Date.now();
	while (!(await condition()) && Date.now() - start < timeout)
		await sleep(interval);
};

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
