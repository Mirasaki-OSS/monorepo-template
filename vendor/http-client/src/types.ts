export type QueryPrimitive = string | number | boolean;
export type QueryValue =
	| QueryPrimitive
	| null
	| undefined
	| QueryPrimitive[]
	| null[]
	| undefined[];

export type HttpRequestOptions = Omit<RequestInit, 'body'> & {
	body?: unknown;
	query?: Record<string, QueryValue> | URLSearchParams;
	pathParams?: Record<string, string | number>;
	timeoutMs?: number;
	retries?: number;
	retryBaseDelayMs?: number;
	retryMaxDelayMs?: number;
	retryOnStatuses?: number[];
	parseAs?: 'json' | 'text';
};

export type HttpClientConfig = {
	baseUrl: string;
	serviceName: string;
	defaultHeaders?:
		| HeadersInit
		| ((ctx: { accessToken?: string }) => HeadersInit | Promise<HeadersInit>);
	resolveRetryOptions?: ResolveRetryOptions;
};

export type DefaultHeadersResolver = Extract<
	NonNullable<HttpClientConfig['defaultHeaders']>,
	(ctx: { accessToken?: string }) => HeadersInit | Promise<HeadersInit>
>;

export type HTTPClientRequestOptions = HttpRequestOptions & {
	accessToken?: string;
	serviceName?: string;
	resolveRetryOptions?: ResolveRetryOptions;
};

// =============================================================
// Start Retry Types
// =============================================================

export type RetryOptions = {
	retry?: boolean;
	delayMs?: number;
};

export type RetryContext<TRequest = unknown> = {
	response?: Response;
	error?: unknown;
	attempt: number;
	maxRetries: number;
	defaultRetry: boolean;
	defaultDelayMs: number;
	input: string;
	serviceName: string;
	request: Readonly<TRequest>;
};

export type RetryOptionsResult = RetryOptions | boolean | undefined;

export type ResolveRetryOptions<TRequest = unknown> = (
	context: RetryContext<TRequest>
) => RetryOptionsResult | Promise<RetryOptionsResult>;

export type RetryEvaluationInput<TRequest = unknown> = {
	response?: Response;
	error?: unknown;
	attempt: number;
	retries: number;
	retryBaseDelayMs: number;
	retryMaxDelayMs: number;
	retryOnStatuses: number[];
	input: string;
	serviceName: string;
	request: Readonly<TRequest>;
	isRetryableError?: (error: unknown) => boolean;
};
