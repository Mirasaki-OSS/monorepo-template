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
	DEFAULT_TIMEOUT_MS,
	defaultRetryOptions,
	evaluateRetry,
} from './retry';
import type {
	DefaultHeadersResolver,
	HTTPClientRequestOptions,
	HttpClientConfig,
	HttpRequestRetryOptions,
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
			raw: Response | null;
		}
	: R & {
			/** The original Response object from the Fetch API (cloned). */
			raw: Response;
		};

const createRequestError = <T>(
	body: CreateHTTPErrorOptions,
	response: Response | null
): HTTPClientResponse<T, HTTPErrorResponse> => {
	return {
		...new HTTPError({
			...body,
		}).toJSON(),
		raw: response,
	};
};

export class HttpClient {
	readonly baseUrl: string;
	readonly serviceName: string;
	readonly defaultHeaders?: HeadersInit | DefaultHeadersResolver;
	readonly defaultRetryOptions?: HttpRequestRetryOptions;

	private readonly staticDefaultHeaders: Headers;
	private readonly defaultHeadersResolver?: DefaultHeadersResolver;

	constructor(config: HttpClientConfig) {
		this.baseUrl = buildUrl(config.baseUrl, null);
		this.serviceName = config.serviceName;
		this.defaultHeaders = config.defaultHeaders;
		this.defaultRetryOptions = config.retryOptions;

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
			retryOptions: requestRetryOptions,
			parseAs = 'json',
			accessToken,
			serviceName,
			headers,
			body,
			query,
			pathParams,
			...init
		} = options;

		const retryOptions = {
			...defaultRetryOptions,
			...this.defaultRetryOptions,
			...requestRetryOptions,
		};
		const maxRetryAttempts = retryOptions.enabled
			? Math.max(0, retryOptions.maxAttempts)
			: 1;

		const resolvedServiceName = serviceName ?? this.serviceName;
		const resolvedPath = resolvePathParams(input, pathParams);
		const url = appendQuery(buildUrl(this.baseUrl, resolvedPath), query);
		const method = (init.method ?? 'GET').toUpperCase();
		const defaultHeaders = await this.getDefaultHeaders(accessToken);
		const mergedHeaders = resolveRequestHeaders(
			mergeHeaders(defaultHeaders, headers),
			body,
			parseAs
		);

		for (let attempt = 0; attempt < maxRetryAttempts; attempt++) {
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
					raw: responseClone,
				};

				if (!response.ok) {
					const retryDecision = await evaluateRetry({
						response,
						attempt,
						method,
						input,
						serviceName: resolvedServiceName,
						request: options,
						...retryOptions,
						maxAttempts: maxRetryAttempts,
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

				const retryDecision = await evaluateRetry({
					error,
					attempt,
					method,
					input,
					serviceName: resolvedServiceName,
					request: options,
					...retryOptions,
					maxAttempts: maxRetryAttempts,
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
