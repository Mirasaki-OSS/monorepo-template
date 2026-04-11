import { mergeHeaders, normalizeHeaders } from '@md-oss/common/http';
import {
	type CreateHTTPErrorOptions,
	HTTPError,
} from '@md-oss/common/http/errors';
import { statusCodes } from '@md-oss/common/http/status-codes';
import type {
	HeadersInit,
	HTTPErrorResponse,
	HTTPResponse,
} from '@md-oss/common/http/types';
import { RuntimeUtils } from '@md-oss/common/utils';
import { parseJson } from '@md-oss/serdes';
import {
	appendQuery,
	buildUrl,
	parseErrorResponse,
	resolvePathParams,
	resolveRequestHeaders,
	toBody,
} from './resolvers';
import {
	DEFAULT_RETRIES,
	DEFAULT_RETRY_BASE_DELAY_MS,
	DEFAULT_RETRY_MAX_DELAY_MS,
	DEFAULT_RETRY_STATUSES,
	DEFAULT_TIMEOUT_MS,
	evaluateRetry,
	isRetryableNetworkError,
} from './retry';
import type {
	DefaultHeadersResolver,
	HTTPClientRequestOptions,
	HttpClientConfig,
	ResolveRetryOptions,
} from './types';

export type {
	HeadersInit,
	HTTPErrorResponse,
	HTTPResponse,
	HTTPSuccessResponse,
	StatusCode,
	StatusCodeText,
} from '@md-oss/common/http';
export {
	createHTTPError,
	createHTTPErrorResponse,
	HTTPError,
	isHTTPError,
	isHTTPErrorResponse,
	isStatusCodeText,
	mergeHeaders,
	normalizeHeaders,
	parseError,
	parseHeaders,
	resolveStatusCode,
	resolveStatusText,
	statusCodes,
	stripProxyAndWebsocketHeaders,
} from '@md-oss/common/http';
export {
	type JsonPrimitive,
	type JsonValueLike,
	type SerializedJson,
	serializeJson,
} from '@md-oss/serdes';
export * from './resolvers';
export * from './retry';
export type * from './types';

export type HTTPClientResponse<
	T,
	R extends HTTPResponse<T>,
> = R extends HTTPErrorResponse
	? HTTPErrorResponse & {
			/** The original Response object from the Fetch API (cloned). May be null if the error was due to a network failure. */
			response: Response | null;
		}
	: R & {
			/** The original Response object from the Fetch API (cloned). */
			response: Response;
		};

const createRequestError = <T>(
	body: CreateHTTPErrorOptions,
	response: Response | null
): HTTPClientResponse<T, HTTPErrorResponse> => {
	return {
		...new HTTPError({
			...body,
		}).toJSON(),
		response,
	};
};

export class HttpClient {
	readonly baseUrl: string;
	readonly serviceName: string;
	readonly defaultHeaders?: HeadersInit | DefaultHeadersResolver;
	readonly resolveRetryOptions?: ResolveRetryOptions;
	private readonly staticDefaultHeaders: Headers;
	private readonly defaultHeadersResolver?: DefaultHeadersResolver;

	constructor(config: HttpClientConfig) {
		this.baseUrl = buildUrl(config.baseUrl, null);
		this.serviceName = config.serviceName;
		this.defaultHeaders = config.defaultHeaders;
		this.resolveRetryOptions = config.resolveRetryOptions;

		if (typeof config.defaultHeaders === 'function') {
			this.defaultHeadersResolver = config.defaultHeaders;
			this.staticDefaultHeaders = new Headers();
		} else {
			this.defaultHeadersResolver = undefined;
			this.staticDefaultHeaders = mergeHeaders(config.defaultHeaders);
		}
	}

	private async getDefaultHeaders(accessToken?: string) {
		if (this.defaultHeadersResolver) {
			return this.defaultHeadersResolver({ accessToken });
		}

		return this.staticDefaultHeaders;
	}

	async request<T = unknown>(
		input: string,
		options: HTTPClientRequestOptions
	): Promise<HTTPClientResponse<T, HTTPResponse<T>>> {
		const {
			timeoutMs = DEFAULT_TIMEOUT_MS,
			retries = DEFAULT_RETRIES,
			retryBaseDelayMs = DEFAULT_RETRY_BASE_DELAY_MS,
			retryMaxDelayMs = DEFAULT_RETRY_MAX_DELAY_MS,
			retryOnStatuses = DEFAULT_RETRY_STATUSES,
			parseAs = 'json',
			accessToken,
			serviceName,
			resolveRetryOptions: resolveRequestRetryOptions,
			headers,
			body,
			query,
			pathParams,
			...init
		} = options;

		const resolvedServiceName = serviceName ?? this.serviceName;
		const resolvedPath = resolvePathParams(input, pathParams);
		const url = appendQuery(buildUrl(this.baseUrl, resolvedPath), query);
		const retryResolver =
			resolveRequestRetryOptions ?? this.resolveRetryOptions;
		const defaultHeaders = await this.getDefaultHeaders(accessToken);
		const mergedHeaders = resolveRequestHeaders(
			mergeHeaders(defaultHeaders, headers),
			body,
			parseAs
		);

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

				const responseClone = response.clone();
				const responseFields = {
					statusCode: response.status,
					statusText: response.statusText,
					headers: normalizeHeaders(response.headers),
					response: responseClone,
				};

				if (!response.ok) {
					const retryDecision = await evaluateRetry(retryResolver, {
						response,
						attempt,
						retries,
						retryBaseDelayMs,
						retryMaxDelayMs,
						retryOnStatuses,
						input,
						serviceName: resolvedServiceName,
						request: options,
						isRetryableError: isRetryableNetworkError,
					});

					if (retryDecision.retry) {
						await RuntimeUtils.sleep(retryDecision.delayMs);
						continue;
					}

					const errorBody = await parseErrorResponse(
						response,
						`${resolvedServiceName} request failed (${response.status})`
					);

					return createRequestError(
						{
							...errorBody,
							...responseFields,
						},
						response
					);
				}

				if (parseAs === 'text') {
					return {
						ok: true,
						data: (await response.text()) as T,
						...responseFields,
					};
				}

				const text = await response.text();
				if (!text) {
					return {
						ok: true,
						data: undefined as T,
						...responseFields,
					};
				}

				try {
					return {
						ok: true,
						data: parseJson<T>(text),
						...responseFields,
					};
				} catch {
					return createRequestError(
						{
							code: 'INVALID_RESPONSE',
							message: `${resolvedServiceName} returned invalid JSON`,
							...responseFields,
							details: { responseText: text },
						},
						response
					);
				}
			} catch (error) {
				clearTimeout(timeout);

				const retryDecision = await evaluateRetry(retryResolver, {
					error,
					attempt,
					retries,
					retryBaseDelayMs,
					retryMaxDelayMs,
					retryOnStatuses,
					input,
					serviceName: resolvedServiceName,
					request: options,
					isRetryableError: isRetryableNetworkError,
				});

				if (retryDecision.retry) {
					await RuntimeUtils.sleep(retryDecision.delayMs);
					continue;
				}

				return createRequestError(
					{
						code: 'NETWORK_ERROR',
						message: `${resolvedServiceName} request failed due to a network error`,
						statusCode: 0,
						statusText: 'Network Error',
						details: {
							originalError:
								error instanceof Error ? error.message : String(error),
						},
					},
					null
				);
			}
		}

		return createRequestError(
			{
				code: 'RETRIES_EXCEEDED',
				message: `${resolvedServiceName} request failed after retries`,
				statusCode: statusCodes.SERVICE_UNAVAILABLE,
				statusText: 'Service Unavailable',
				details: null,
			},
			null
		);
	}
}

export const createHttpClient = (config: HttpClientConfig) => {
	return new HttpClient(config);
};
