import type {
	HttpRequestRetryOptions,
	ParseRateLimitDelayMs,
	RetryEvaluationInput,
	RetryHookContext,
} from './types';

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_RETRIES = 2;
export const DEFAULT_RETRY_BASE_DELAY_MS = 200;
export const DEFAULT_RETRY_MAX_DELAY_MS = 2_000;
export const DEFAULT_RETRY_BACKOFF_FACTOR = 2;
export const DEFAULT_RETRY_JITTER_RATIO = 0.2;
export const DEFAULT_RETRYABLE_METHODS = [
	'GET',
	'HEAD',
	'OPTIONS',
	'PUT',
	'DELETE',
];
export const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];
export const DEFAULT_CAP_RATE_LIMIT_DELAY_TO_MAX_DELAY_MS = false;

export const isRetryableNetworkError = (error: unknown) => {
	if (error instanceof Error && error.name === 'AbortError') {
		return true;
	}

	const message =
		error instanceof Error
			? error.message.toLowerCase()
			: String(error).toLowerCase();
	return (
		message.includes('fetch failed') ||
		message.includes('network') ||
		message.includes('socket') ||
		message.includes('timed out') ||
		message.includes('abort')
	);
};

export const withBackoffAndJitter = (
	attempt: number,
	baseMs: number,
	maxMs: number,
	backoffFactor = DEFAULT_RETRY_BACKOFF_FACTOR,
	jitterRatio = DEFAULT_RETRY_JITTER_RATIO
) => {
	const exp = Math.min(maxMs, baseMs * backoffFactor ** attempt);
	if (jitterRatio <= 0) {
		return Math.round(exp);
	}

	const jitter = exp * jitterRatio;
	const min = Math.max(0, exp - jitter);
	const max = exp + jitter;

	return Math.round(min + Math.random() * (max - min));
};

export const defaultParseRateLimitDelayMs: ParseRateLimitDelayMs = (
	response: Response
) => {
	const retryAfterValue = response.headers.get('retry-after');
	if (!retryAfterValue) {
		const resetHeaders = [
			'x-ratelimit-reset-after',
			'x-rate-limit-reset-after',
			'x-ratelimit-reset',
			'x-rate-limit-reset',
		];

		for (const header of resetHeaders) {
			const value = response.headers.get(header);
			if (!value) {
				continue;
			}

			const numeric = Number.parseFloat(value);
			if (!Number.isFinite(numeric)) {
				continue;
			}

			if (header.includes('after')) {
				return Math.max(0, Math.round(numeric * 1000));
			}

			const asEpochMs = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
			return Math.max(0, Math.round(asEpochMs - Date.now()));
		}

		return null;
	}

	const numericDelaySeconds = Number.parseFloat(retryAfterValue);
	if (Number.isFinite(numericDelaySeconds)) {
		return Math.max(0, Math.round(numericDelaySeconds * 1000));
	}

	const retryAt = Date.parse(retryAfterValue);
	if (Number.isNaN(retryAt)) {
		return null;
	}

	return Math.max(0, Math.round(retryAt - Date.now()));
};

export const defaultRetryOptions = {
	enabled: true,
	maxAttempts: DEFAULT_RETRIES,
	baseDelayMs: DEFAULT_RETRY_BASE_DELAY_MS,
	maxDelayMs: DEFAULT_RETRY_MAX_DELAY_MS,
	backoffFactor: DEFAULT_RETRY_BACKOFF_FACTOR,
	jitterRatio: DEFAULT_RETRY_JITTER_RATIO,
	retryableMethods: DEFAULT_RETRYABLE_METHODS,
	retryableStatusCodes: DEFAULT_RETRY_STATUSES,
	capRateLimitDelayToMaxDelayMs: DEFAULT_CAP_RATE_LIMIT_DELAY_TO_MAX_DELAY_MS,
	parseRateLimitDelayMs: defaultParseRateLimitDelayMs,
	isRetryableError: isRetryableNetworkError,
} satisfies Required<Omit<HttpRequestRetryOptions, 'onRetry'>>;

export const evaluateRetry = async <TRequest = unknown>({
	response,
	error,
	attempt,
	maxAttempts,
	method,
	baseDelayMs,
	maxDelayMs,
	backoffFactor,
	jitterRatio,
	retryableMethods,
	retryableStatusCodes,
	capRateLimitDelayToMaxDelayMs,
	parseRateLimitDelayMs,
	onRetry,
	input,
	serviceName,
	request,
	isRetryableError = isRetryableNetworkError,
}: RetryEvaluationInput<TRequest>): Promise<{
	retry: boolean;
	delayMs: number;
}> => {
	const normalizedMethod = method.toUpperCase();
	const methodAllowsRetry = retryableMethods.includes(normalizedMethod);

	// Determine if we should retry
	let shouldRetry = false;

	if (attempt < maxAttempts && methodAllowsRetry) {
		if (response) {
			// HTTP response: check status codes
			shouldRetry = retryableStatusCodes.includes(response.status);
		} else {
			// Network error: check error detection
			shouldRetry = isRetryableError?.(error) ?? false;
		}
	}

	if (!shouldRetry) {
		return { retry: false, delayMs: 0 };
	}

	// Calculate delay
	let delayMs = 0;

	if (response) {
		const parsedRateLimitDelayMs = parseRateLimitDelayMs(response);
		if (parsedRateLimitDelayMs !== null) {
			const safeRateLimitDelayMs = Math.max(
				0,
				Math.round(parsedRateLimitDelayMs)
			);
			if (!capRateLimitDelayToMaxDelayMs) {
				delayMs = safeRateLimitDelayMs;
			} else {
				delayMs = Math.min(safeRateLimitDelayMs, maxDelayMs);
			}
		} else {
			delayMs = withBackoffAndJitter(
				attempt,
				baseDelayMs,
				maxDelayMs,
				backoffFactor,
				jitterRatio
			);
		}
	} else {
		delayMs = withBackoffAndJitter(
			attempt,
			baseDelayMs,
			maxDelayMs,
			backoffFactor,
			jitterRatio
		);
	}

	// Invoke retry hook
	if (onRetry) {
		const context: RetryHookContext<TRequest> = {
			response: response?.clone(),
			error,
			attempt,
			maxAttempts,
			method: normalizedMethod,
			delayMs,
			input,
			serviceName,
			request,
		};
		await onRetry(context);
	}

	return { retry: true, delayMs };
};
