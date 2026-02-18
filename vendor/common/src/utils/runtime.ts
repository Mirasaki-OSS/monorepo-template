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

/**
 * Result of a batch operation
 */
export type BatchResult<T> = {
	/** Successfully processed results */
	results: T[];
	/** Errors that occurred during processing */
	errors: Array<{ index: number; error: Error }>;
	/** Total number of tasks */
	total: number;
	/** Number of successful tasks */
	successful: number;
	/** Number of failed tasks */
	failed: number;
};

/**
 * Options for batch processing
 */
export interface BatchProcessOptions {
	/** Maximum number of concurrent executions (default: 5) */
	concurrency?: number;
	/** Whether to stop on first error (default: false) */
	stopOnError?: boolean;
	/** Timeout per task in milliseconds (default: none) */
	taskTimeout?: number;
	/** Delay between batches in milliseconds (default: 0) */
	batchDelay?: number;
	/** Callback for progress updates */
	onProgress?: (completed: number, total: number) => void;
	/** Callback for each error */
	onError?: (error: Error, index: number) => void;
}

/**
 * Options for batch processing with retry
 */
export interface BatchProcessWithRetryOptions extends BatchProcessOptions {
	/** Maximum number of retry attempts (default: 3) */
	maxRetries?: number;
	/** Delay between retries in milliseconds (default: 1000) */
	retryDelay?: number;
	/** Backoff multiplier for retry delay (default: 2) */
	retryBackoff?: number;
}

/**
 * Execute async tasks with controlled concurrency
 * @param tasks - Array of async functions to execute
 * @param concurrency - Maximum number of concurrent executions (default: 5)
 * @returns Array of results in the same order as input tasks
 * @throws Error if any task fails (use batchProcess for error handling)
 * @example
 * const results = await executeWithConcurrency(
 *   urls.map(url => () => fetch(url)),
 *   3
 * );
 */
async function executeWithConcurrency<T>(
	tasks: (() => Promise<T>)[],
	concurrency = 5
): Promise<T[]> {
	if (concurrency <= 0) {
		throw new Error('Concurrency must be greater than 0');
	}

	if (tasks.length === 0) {
		return [];
	}

	const results: T[] = new Array(tasks.length);
	let nextTaskIndex = 0;

	const worker = async (): Promise<void> => {
		while (nextTaskIndex < tasks.length) {
			const taskIndex = nextTaskIndex++;
			results[taskIndex] = await tasks[taskIndex]();
		}
	};

	const numWorkers = Math.min(concurrency, tasks.length);
	const workers = Array.from({ length: numWorkers }, () => worker());

	await Promise.all(workers);
	return results;
}

/**
 * Process tasks in batches with advanced error handling and progress tracking
 * @param tasks - Array of async functions to execute
 * @param options - Batch processing options
 * @returns BatchResult with results and error information
 * @example
 * const result = await batchProcess(
 *   urls.map(url => () => fetchData(url)),
 *   {
 *     concurrency: 3,
 *     stopOnError: false,
 *     onProgress: (done, total) => console.log(`${done}/${total}`)
 *   }
 * );
 */
async function batchProcess<T>(
	tasks: (() => Promise<T>)[],
	options: BatchProcessOptions = {}
): Promise<BatchResult<T>> {
	const {
		concurrency = 5,
		stopOnError = false,
		taskTimeout,
		batchDelay = 0,
		onProgress,
		onError,
	} = options;

	if (concurrency <= 0) {
		throw new Error('Concurrency must be greater than 0');
	}

	if (tasks.length === 0) {
		return {
			results: [],
			errors: [],
			total: 0,
			successful: 0,
			failed: 0,
		};
	}

	const results: T[] = new Array(tasks.length);
	const errors: Array<{ index: number; error: Error }> = [];
	let completed = 0;
	let nextTaskIndex = 0;
	let shouldStop = false;

	const executeTask = async (index: number): Promise<void> => {
		try {
			const task = tasks[index];
			const result = taskTimeout
				? await awaitOrTimeout(task(), taskTimeout)
				: await task();
			results[index] = result;
			completed++;
			onProgress?.(completed, tasks.length);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			errors.push({ index, error: err });
			completed++;
			onError?.(err, index);

			if (stopOnError) {
				shouldStop = true;
			}

			onProgress?.(completed, tasks.length);
		}
	};

	const worker = async (): Promise<void> => {
		while (nextTaskIndex < tasks.length && !shouldStop) {
			const taskIndex = nextTaskIndex++;
			await executeTask(taskIndex);

			// Add delay between batches if configured
			if (batchDelay > 0 && nextTaskIndex < tasks.length) {
				await sleep(batchDelay);
			}
		}
	};

	const numWorkers = Math.min(concurrency, tasks.length);
	const workers = Array.from({ length: numWorkers }, () => worker());

	await Promise.all(workers);

	return {
		results: results.filter((_, idx) => !errors.some((e) => e.index === idx)),
		errors,
		total: tasks.length,
		successful: tasks.length - errors.length,
		failed: errors.length,
	};
}

/**
 * Map over an array with controlled concurrency
 * @param items - Array of items to process
 * @param mapper - Async function to transform each item
 * @param concurrency - Maximum number of concurrent executions (default: 5)
 * @returns Array of transformed results in the same order
 * @throws Error if any transformation fails
 * @example
 * const users = await batchMap(
 *   userIds,
 *   async (id) => await fetchUser(id),
 *   3
 * );
 */
async function batchMap<T, R>(
	items: T[],
	mapper: (item: T, index: number) => Promise<R>,
	concurrency = 5
): Promise<R[]> {
	const tasks = items.map((item, index) => () => mapper(item, index));
	return executeWithConcurrency(tasks, concurrency);
}

/**
 * Map over an array with controlled concurrency and retry logic
 * @param items - Array of items to process
 * @param mapper - Async function to transform each item
 * @param options - Batch processing options with retry configuration
 * @returns BatchResult with results and error information
 * @example
 * const result = await batchMapWithRetry(
 *   userIds,
 *   async (id) => await fetchUser(id),
 *   {
 *     concurrency: 3,
 *     maxRetries: 3,
 *     retryDelay: 1000,
 *     stopOnError: false
 *   }
 * );
 */
async function batchMapWithRetry<T, R>(
	items: T[],
	mapper: (item: T, index: number) => Promise<R>,
	options: BatchProcessWithRetryOptions = {}
): Promise<BatchResult<R>> {
	const {
		maxRetries = 3,
		retryDelay = 1000,
		retryBackoff = 2,
		...batchOptions
	} = options;

	const createTaskWithRetry = (item: T, index: number): (() => Promise<R>) => {
		return async () => {
			let lastError: Error | null = null;
			let currentDelay = retryDelay;

			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					return await mapper(item, index);
				} catch (error) {
					lastError = error instanceof Error ? error : new Error(String(error));

					// Don't delay after the last attempt
					if (attempt < maxRetries) {
						await sleep(currentDelay);
						currentDelay *= retryBackoff;
					}
				}
			}

			throw lastError;
		};
	};

	const tasks = items.map((item, index) => createTaskWithRetry(item, index));
	return batchProcess(tasks, batchOptions);
}

/**
 * Process items in chunks/batches sequentially
 * @param items - Array of items to process
 * @param batchSize - Number of items per batch
 * @param processor - Function to process each batch
 * @returns Array of batch results
 * @example
 * const results = await processBatches(
 *   allUsers,
 *   100,
 *   async (batch) => await bulkInsert(batch)
 * );
 */
async function processBatches<T, R>(
	items: T[],
	batchSize: number,
	processor: (batch: T[], batchIndex: number) => Promise<R>
): Promise<R[]> {
	if (batchSize <= 0) {
		throw new Error('Batch size must be greater than 0');
	}

	const results: R[] = [];
	let batchIndex = 0;

	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const result = await processor(batch, batchIndex++);
		results.push(result);
	}

	return results;
}

export {
	sleep,
	sleepUntil,
	sleepUntilOrTimeout,
	awaitOrTimeout,
	safeSetTimeout,
	safeSetInterval,
	safeSetAsyncInterval,
	executeWithConcurrency,
	batchProcess,
	batchMap,
	batchMapWithRetry,
	processBatches,
};
