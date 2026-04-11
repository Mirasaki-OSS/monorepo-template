import type {
	ResolveRetryOptions,
	RetryContext,
	RetryEvaluationInput,
} from './types';

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_RETRIES = 2;
export const DEFAULT_RETRY_BASE_DELAY_MS = 200;
export const DEFAULT_RETRY_MAX_DELAY_MS = 2_000;
export const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

export const isRetryableNetworkError = (error: unknown) => {
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
	maxMs: number
) => {
	const exp = Math.min(maxMs, baseMs * 2 ** attempt);
	const jitter = Math.floor(Math.random() * Math.min(250, exp * 0.2));
	return exp + jitter;
};

export const resolveRetryAfterDelayMs = (response: Response) => {
	const retryAfterValue =
		response.headers.get('retry-after') ??
		response.headers.get('x-ratelimit-reset-after');

	if (!retryAfterValue) return undefined;

	const numericDelaySeconds = Number(retryAfterValue);
	if (Number.isFinite(numericDelaySeconds)) {
		return Math.max(0, Math.ceil(numericDelaySeconds * 1000));
	}

	const retryAt = Date.parse(retryAfterValue);
	if (Number.isNaN(retryAt)) {
		return undefined;
	}

	return Math.max(0, retryAt - Date.now());
};

export const resolveRetryDecision = async <TRequest = unknown>(
	resolveRetryOptions: ResolveRetryOptions<TRequest> | undefined,
	context: RetryContext<TRequest>
) => {
	const result = await resolveRetryOptions?.(context);

	if (typeof result === 'boolean') {
		return {
			retry: result,
			delayMs: context.defaultDelayMs,
		};
	}

	return {
		retry: result?.retry ?? context.defaultRetry,
		delayMs: Math.max(0, result?.delayMs ?? context.defaultDelayMs),
	};
};

export const evaluateRetry = async <TRequest = unknown>(
	resolveRetryOptions: ResolveRetryOptions<TRequest> | undefined,
	{
		response,
		error,
		attempt,
		retries,
		retryBaseDelayMs,
		retryMaxDelayMs,
		retryOnStatuses,
		input,
		serviceName,
		request,
		isRetryableError = isRetryableNetworkError,
	}: RetryEvaluationInput<TRequest>
) => {
	const defaultRetry = response
		? attempt < retries && retryOnStatuses.includes(response.status)
		: attempt < retries && (isRetryableError?.(error) ?? false);
	const defaultDelayMs = response
		? (resolveRetryAfterDelayMs(response) ??
			withBackoffAndJitter(attempt, retryBaseDelayMs, retryMaxDelayMs))
		: withBackoffAndJitter(attempt, retryBaseDelayMs, retryMaxDelayMs);

	return resolveRetryDecision(resolveRetryOptions, {
		response: response?.clone(),
		error,
		attempt,
		maxRetries: retries,
		defaultRetry,
		defaultDelayMs,
		input,
		serviceName,
		request,
	});
};
