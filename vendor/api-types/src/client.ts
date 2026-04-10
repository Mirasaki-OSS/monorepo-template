import { HTTPError } from '@md-oss/common/http/errors';
import {
	isHTTPError,
	isHTTPErrorResponse,
	parseError,
} from '@md-oss/common/http/guards';
import { statusCodes } from '@md-oss/common/http/status-codes';
import type { SerializedJson } from '@md-oss/serdes';
import { stringifyJson } from '@md-oss/serdes';
import type { RequestOptions } from './request';
import type { InferApi, MethodKeys, RouteKeys, RouteRegistry } from './types';

export {
	type JsonPrimitive,
	type JsonValueLike,
	type SerializedJson,
	serializeJson,
} from '@md-oss/serdes';

const interpolatePath = (
	path: string,
	params: Record<string, string | number>
) => {
	return path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
		const value = params[key];
		if (value == null) {
			throw new Error(`Missing path param: ${key}`);
		}
		return encodeURIComponent(String(value));
	});
};

const forbiddenProxyHeaders = [
	'proxy-authorization',
	'proxy-authenticate',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'via',
];

const forbiddenWebsocketHeaders = ['connection', 'host', 'upgrade'];

const headersToRecord = (
	headers: Headers | Record<string, string>
): Record<string, string> => {
	if (headers instanceof Headers) {
		const result: Record<string, string> = {};
		headers.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	if (typeof headers === 'object' && headers !== null) {
		return headers as Record<string, string>;
	}

	throw new TypeError('Headers must be an object or an instance of Headers');
};

export const stripProxyAndWebsocketHeaders = (
	headers: Headers | Record<string, string>
): Record<string, string> => {
	const resolvedHeaders = headersToRecord(headers);

	for (const header of [
		...forbiddenProxyHeaders,
		...forbiddenWebsocketHeaders,
	]) {
		if (header in resolvedHeaders) {
			delete resolvedHeaders[header];
		}
	}

	return resolvedHeaders;
};

export const parseHeaders = (
	headers: Headers | Record<string, string>,
	shouldStripProxyAndWebsocketHeaders = true
): Record<string, string> => {
	let resolvedHeaders = headersToRecord(headers);

	if (shouldStripProxyAndWebsocketHeaders) {
		resolvedHeaders = stripProxyAndWebsocketHeaders(resolvedHeaders);
	}

	return resolvedHeaders;
};

export type Logger = {
	error: (message: string, data?: Record<string, unknown>) => void;
};

export type ClientConfig = {
	baseUrl: string;
	logger?: Logger;
	defaultHeaders?:
		| Record<string, string>
		| (() => Record<string, string> | Promise<Record<string, string>>);
};

export type IdentityResponseTypeTransformer = 'identity';
export type JsonResponseTypeTransformer = 'json';
export type ResponseTypeTransformer =
	| IdentityResponseTypeTransformer
	| JsonResponseTypeTransformer;

export type ApplyResponseTypeTransformer<
	TTransformer extends ResponseTypeTransformer,
	T,
> = TTransformer extends JsonResponseTypeTransformer ? SerializedJson<T> : T;

/**
 * Creates a type-safe API client for a given route registry.
 * This factory function allows external packages to create their own typed clients.
 *
 * @example
 * ```typescript
 * const myRoutes = {
 *   "/users/:id": {
 *     params: z.object({ id: z.string() }),
 *     endpoints: {
 *       GET: {
 *         response: {} as User,
 *         permissions: null,
 *       },
 *     },
 *   },
 * } as const satisfies RouteRegistry;
 *
 * const client = createApiClient(myRoutes, {
 *   baseUrl: "https://api.example.com",
 * });
 *
 * const user = await client.request("/users/:id", {
 *   method: "GET",
 *   params: { id: "123" },
 * });
 * ```
 */
export function createApiClient<
	TRegistry extends RouteRegistry,
	TTransformer extends
		ResponseTypeTransformer = IdentityResponseTypeTransformer,
>(_registry: TRegistry, config: ClientConfig) {
	const { baseUrl, logger: _logger = console } = config;

	return {
		/**
		 * Make a type-safe request to the API.
		 */
		async request<
			TPath extends RouteKeys<TRegistry>,
			TMethod extends MethodKeys<TRegistry, TPath>,
		>(
			path: TPath,
			options: RequestOptions<
				TRegistry,
				InferApi<TRegistry>,
				TPath,
				TMethod
			> & {
				headers?:
					| Record<string, string>
					| Headers
					| (Headers & {
							append(...args: unknown[]): void;
							set(...args: unknown[]): void;
							delete(...args: unknown[]): void;
					  });
				metadata?: Record<string, unknown>;
				baseUrl?: string;
				logger?: Logger;
			}
		): Promise<
			| ApplyResponseTypeTransformer<
					TTransformer,
					InferApi<TRegistry>[TPath]['endpoints'][TMethod]['response']
			  >
			| HTTPError
		> {
			type LocalResponse = ApplyResponseTypeTransformer<
				TTransformer,
				InferApi<TRegistry>[TPath]['endpoints'][TMethod]['response']
			>;

			const {
				method,
				params,
				body,
				query,
				headers = {},
				metadata = {},
				logger: requestLogger,
			} = options;
			const logger = requestLogger || _logger;

			let fullPath: string;
			try {
				fullPath = interpolatePath(path, params || {});
			} catch (error) {
				return parseError(
					error,
					'BAD_REQUEST',
					'Failed to interpolate path with provided params'
				);
			}

			if (query && typeof query === 'object') {
				const queryParams = new URLSearchParams();
				for (const [key, value] of Object.entries(query)) {
					if (value != null) queryParams.append(key, String(value));
				}
				if ([...queryParams].length > 0) {
					fullPath += `?${queryParams.toString()}`;
				}
			}

			let endpoint: string,
				requestUrl: string,
				requestHeaders: Record<string, string>,
				requestBody: string | null;

			try {
				endpoint = fullPath;
				requestUrl = new URL(endpoint, options?.baseUrl ?? baseUrl).toString();

				// Resolve default headers
				const defaultHeaders =
					typeof config.defaultHeaders === 'function'
						? await config.defaultHeaders()
						: config.defaultHeaders || {};

				requestHeaders = {
					Accept: 'application/json',
					...(body ? { 'Content-Type': 'application/json' } : {}),
					...parseHeaders(
						{
							...headers,
							...defaultHeaders,
						},
						true
					),
				};
				requestBody = body ? stringifyJson(body) : null;
			} catch (error) {
				return parseError(
					error,
					'BAD_REQUEST',
					'Failed to construct request URL or headers'
				);
			}

			// Unset content-length so fetch can set it automatically
			if ('content-length' in requestHeaders) {
				delete requestHeaders['content-length'];
			}
			if ('Content-Length' in requestHeaders) {
				delete requestHeaders['Content-Length'];
			}

			const response = await fetch(requestUrl, {
				method,
				credentials: 'include',
				headers: requestHeaders,
				body: requestBody,
			}).catch((error) => {
				console.error(`Network error while requesting ${endpoint}:`, error);
				logger.error(`Network error while requesting ${endpoint}: ${error}`, {
					...metadata,
					path,
					method,
					params: JSON.stringify(params, null, 2),
					query: JSON.stringify(query, null, 2),
					body: requestBody,
					error: String(error),
					headers: JSON.stringify(requestHeaders, null, 2),
				});
				return new HTTPError(statusCodes.SERVICE_UNAVAILABLE, {
					code: 'NETWORK_ERROR',
					message: `Network error while requesting ${endpoint}`,
					details: String(error),
				});
			});

			if (isHTTPErrorResponse(response)) {
				console.log('\n\n\n\n\n', response, '\n\n\n\n\n');
				return new HTTPError(response.statusCode, response.body);
			}

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				const isRateLimitError = response.status === 429;
				const isAuthError = response.status === 401 || response.status === 403;
				if (!isAuthError && !isRateLimitError) {
					logger.error(
						`Request to ${endpoint} failed with status ${response.status}`,
						{
							...metadata,
							path,
							method,
							params: JSON.stringify(params, null, 2),
							query: JSON.stringify(query, null, 2),
							body: body ? JSON.stringify(body, null, 2) : undefined,
							status: response.status,
							error: JSON.stringify(error, null, 2),
						}
					);
				}
				if (isHTTPErrorResponse(error)) {
					return new HTTPError(error.statusCode, error.body);
				}
				return new HTTPError(statusCodes.SERVICE_UNAVAILABLE, {
					code: 'REQUEST_FAILED',
					message: `Request failed with status ${response.status}`,
					details: `Unexpected response from ${endpoint}: ${JSON.stringify(error, null, 2)}`,
				});
			}

			if (response.status === 204) {
				return null as LocalResponse;
			}

			const json = await response.json().catch(() => {
				return new HTTPError(statusCodes.SERVICE_UNAVAILABLE, {
					code: 'INVALID_RESPONSE',
					message: `Failed to parse response from ${endpoint}`,
					details: {
						status: response.status,
						statusText: response.statusText,
					},
				});
			});

			if (json && typeof json === 'object' && 'data' in json) {
				return json.data as LocalResponse;
			}

			if (isHTTPError(json)) {
				logger.error(`API error from ${endpoint}`, {
					...metadata,
					path,
					method,
					params,
					query,
					body,
					status: response.status,
					error: json,
				});
				return json;
			}

			logger.error(`Unexpected response from ${endpoint}`, {
				...metadata,
				path,
				method,
				params,
				query,
				body,
				status: response.status,
				response: json,
			});

			return new HTTPError(statusCodes.SERVICE_UNAVAILABLE, {
				code: 'UNEXPECTED_RESPONSE',
				message: `Unexpected response from ${endpoint}`,
				details: JSON.stringify(json, null, 2),
			});
		},
	};
}

export type ApiClient<
	TRegistry extends RouteRegistry,
	TTransformer extends
		ResponseTypeTransformer = IdentityResponseTypeTransformer,
> = ReturnType<typeof createApiClient<TRegistry, TTransformer>>;
