import { HTTPError } from '@md-oss/common/http/errors';
import { type StatusCode, statusCodes } from '@md-oss/common/http/status-codes';
import type {
	HTTPErrorResponse,
	HTTPSuccessResponse as HTTPSuccessResponseSuper,
} from '@md-oss/common/http/types';
import { parseJson, stringifyJson } from '@md-oss/serdes';

export {
	type Jsonify,
	type JsonPrimitive,
	type JsonValueLike,
	jsonify,
} from '@md-oss/serdes';

export type HTTPSuccessResponse<T> = Omit<
	HTTPSuccessResponseSuper<T>,
	'message'
> & {
	headers: Headers;
};

export type HTTPResult<T> = HTTPSuccessResponse<T> | HTTPErrorResponse;

export const isHTTPFailure = <T>(
	result: HTTPResult<T>
): result is HTTPErrorResponse => !result.ok;

type QueryPrimitive = string | number | boolean;
type QueryValue =
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
	parseAs?: 'json' | 'text' | 'raw';
};

type HttpClientConfig = {
	baseUrl?: string;
	serviceName: string;
	defaultHeaders?: (ctx: { accessToken?: string }) => HeadersInit;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 200;
const DEFAULT_RETRY_MAX_DELAY_MS = 2_000;
const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withBackoffAndJitter = (
	attempt: number,
	baseMs: number,
	maxMs: number
) => {
	const exp = Math.min(maxMs, baseMs * 2 ** attempt);
	const jitter = Math.floor(Math.random() * Math.min(250, exp * 0.2));
	return exp + jitter;
};

const resolvePathParams = (
	path: string,
	pathParams?: Record<string, string | number>
): string => {
	if (!pathParams) return path;
	return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
		const value = pathParams[key];
		if (value === undefined || value === null) {
			throw new Error(`Missing path parameter: ${key}`);
		}
		return String(value);
	});
};

const buildUrl = (baseUrl: string | undefined, input: string) => {
	if (/^https?:\/\//.test(input)) return input;
	if (!baseUrl) return input;
	return input.startsWith('/') ? `${baseUrl}${input}` : `${baseUrl}/${input}`;
};

const appendQuery = (
	url: string,
	query?: Record<string, QueryValue> | URLSearchParams
): string => {
	if (!query) return url;

	const [path, existing = ''] = url.split('?');
	const params = new URLSearchParams(existing);

	if (query instanceof URLSearchParams) {
		for (const [key, value] of query.entries()) {
			params.append(key, value);
		}
	} else {
		for (const [key, raw] of Object.entries(query)) {
			if (raw == null) continue;

			if (Array.isArray(raw)) {
				for (const item of raw) {
					if (item == null) continue;
					params.append(key, String(item));
				}
			} else {
				params.append(key, String(raw));
			}
		}
	}

	const qs = params.toString();
	return qs ? `${path}?${qs}` : path ? path : url;
};

const toBody = (body: unknown): BodyInit | undefined => {
	if (body == null) return undefined;
	if (
		typeof body === 'string' ||
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		body instanceof Blob ||
		body instanceof ArrayBuffer
	) {
		return body as BodyInit;
	}
	return stringifyJson(body);
};

const isRetryableNetworkError = (error: unknown) => {
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

const parseErrorMessage = async (response: Response, fallback: string) => {
	try {
		const text = await response.clone().text();
		if (!text) return fallback;

		try {
			const parsed = parseJson<Record<string, unknown>>(text);
			if (typeof parsed?.message === 'string') {
				return parsed.message;
			}
			if (typeof parsed?.error === 'string') {
				return parsed.error;
			}
			return fallback;
		} catch {
			return text;
		}
	} catch {
		return fallback;
	}
};

export const createHttpClient = (config: HttpClientConfig) => {
	const request = async <T = unknown>(
		input: string,
		options: HttpRequestOptions & { accessToken?: string } = {}
	): Promise<HTTPResult<T>> => {
		const {
			timeoutMs = DEFAULT_TIMEOUT_MS,
			retries = DEFAULT_RETRIES,
			retryBaseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS,
			retryMaxDelayMs = DEFAULT_RETRY_MAX_DELAY_MS,
			retryOnStatuses = DEFAULT_RETRY_STATUSES,
			parseAs = 'json',
			accessToken,
			headers,
			body,
			query,
			pathParams,
			...init
		} = options;

		const resolvedPath = resolvePathParams(input, pathParams);
		const url = appendQuery(buildUrl(config.baseUrl, resolvedPath), query);
		const mergedHeaders: HeadersInit = {
			...(config.defaultHeaders?.({ accessToken }) ?? {}),
			...(headers ?? {}),
		};

		for (let attempt = 0; attempt <= retries; attempt++) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), timeoutMs);

			try {
				const response = await fetch(url, {
					...init,
					headers: mergedHeaders,
					body: toBody(body),
					signal: controller.signal,
				});
				clearTimeout(timeout);

				if (!response.ok) {
					if (attempt < retries && retryOnStatuses.includes(response.status)) {
						await sleep(
							withBackoffAndJitter(attempt, retryBaseDelayMs, retryMaxDelayMs)
						);
						continue;
					}

					const message = await parseErrorMessage(
						response,
						`${config.serviceName} request failed (${response.status})`
					);

					return new HTTPError({
						code: 'API_ERROR',
						message,
						statusCode: response.status as StatusCode,
						headers: response.headers,
					}).toJSON();
				}

				if (parseAs === 'raw') {
					return {
						ok: true,
						data: response as unknown as T,
						statusCode: response.status,
						headers: response.headers,
					};
				}

				if (parseAs === 'text') {
					return {
						ok: true,
						data: (await response.text()) as T,
						statusCode: response.status,
						headers: response.headers,
					};
				}

				const text = await response.text();
				if (!text) {
					return {
						ok: true,
						data: undefined as T,
						statusCode: response.status,
						headers: response.headers,
					};
				}

				try {
					return {
						ok: true,
						data: parseJson<T>(text),
						statusCode: response.status,
						headers: response.headers,
					};
				} catch {
					return new HTTPError({
						code: 'INVALID_RESPONSE',
						message: `${config.serviceName} returned invalid JSON`,
						statusCode: response.status as StatusCode,
						details: { responseText: text },
						headers: response.headers,
					}).toJSON();
				}
			} catch (error) {
				clearTimeout(timeout);

				if (attempt < retries && isRetryableNetworkError(error)) {
					await sleep(
						withBackoffAndJitter(attempt, retryBaseDelayMs, retryMaxDelayMs)
					);
					continue;
				}

				return new HTTPError({
					code: 'NETWORK_ERROR',
					message: `${config.serviceName} request failed due to a network error`,
					statusCode: statusCodes.SERVICE_UNAVAILABLE,
					details: {
						originalError:
							error instanceof Error ? error.message : String(error),
					},
				}).toJSON();
			}
		}

		return new HTTPError({
			code: 'RETRIES_EXCEEDED',
			message: `${config.serviceName} request failed after retries`,
			statusCode: statusCodes.SERVICE_UNAVAILABLE,
		}).toJSON();
	};

	return { request };
};
