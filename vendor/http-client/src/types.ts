export type QueryPrimitive = string | number | boolean;
export type QueryValue =
	| QueryPrimitive
	| null
	| undefined
	| QueryPrimitive[]
	| null[]
	| undefined[];

export type HttpRequestRetryOptions = {
	enabled?: boolean;
	maxAttempts?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	backoffFactor?: number;
	jitterRatio?: number;
	retryableMethods?: string[];
	retryableStatusCodes?: number[];
	capRateLimitDelayToMaxDelayMs?: boolean;
	parseRateLimitDelayMs?: ParseRateLimitDelayMs;
	isRetryableError?: (error: unknown) => boolean;
	onRetry?: RetryHook;
};

export type HttpRequestOptions = Omit<RequestInit, 'body'> & {
	body?: unknown;
	query?: Record<string, QueryValue> | URLSearchParams;
	pathParams?: Record<string, string | number>;
	timeoutMs?: number;
	retryOptions?: HttpRequestRetryOptions;
	parseAs?: 'json' | 'text';
};

export type HttpClientConfig = {
	baseUrl: string;
	serviceName: string;
	defaultHeaders?:
		| HeadersInit
		| ((ctx: { accessToken?: string }) => HeadersInit | Promise<HeadersInit>);
	retryOptions?: HttpRequestRetryOptions;
};

export type DefaultHeadersResolver = Extract<
	NonNullable<HttpClientConfig['defaultHeaders']>,
	(ctx: { accessToken?: string }) => HeadersInit | Promise<HeadersInit>
>;

export type HTTPClientRequestOptions = HttpRequestOptions & {
	accessToken?: string;
	serviceName?: string;
};

// =============================================================
// Start Retry Types
// =============================================================

export type ParseRateLimitDelayMs = (response: Response) => number | null;

export type RetryHookContext<TRequest = unknown> = {
	response?: Response;
	error?: unknown;
	attempt: number;
	maxAttempts: number;
	method: string;
	delayMs: number;
	input: string;
	serviceName: string;
	request: Readonly<TRequest>;
};

export type RetryHook<TRequest = unknown> = (
	context: RetryHookContext<TRequest>
) => void | Promise<void>;

export type RetryEvaluationInput<TRequest = unknown> = {
	response?: Response;
	error?: unknown;
	attempt: number;
	maxAttempts: number;
	method: string;
	baseDelayMs: number;
	maxDelayMs: number;
	backoffFactor: number;
	jitterRatio: number;
	retryableMethods: string[];
	retryableStatusCodes: number[];
	capRateLimitDelayToMaxDelayMs: boolean;
	parseRateLimitDelayMs: ParseRateLimitDelayMs;
	onRetry?: RetryHook<TRequest>;
	input: string;
	serviceName: string;
	request: Readonly<TRequest>;
	isRetryableError?: (error: unknown) => boolean;
};
