import {
	type HeadersInit,
	mergeHeaders,
	parseHeaders,
	stripProxyAndWebsocketHeaders,
} from '@md-oss/common/http';
import {
	createHttpClient,
	type HTTPClientRequestOptions,
	type HTTPClientResponse,
	type HTTPResponse,
	type HttpClientConfig,
	parseError,
} from '@md-oss/http-client';
import type { SerializedJson } from '@md-oss/serdes';
import type { RequestOptions } from './request';
import type { InferApi, MethodKeys, RouteKeys, RouteRegistry } from './types';

export {
	HTTPError,
	isHTTPError,
	isHTTPErrorResponse,
} from '@md-oss/common/http';

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

export { parseHeaders, stripProxyAndWebsocketHeaders };

export type ClientConfig = {
	baseUrl: string;
	defaultHeaders?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
	httpClientConfig?: Omit<HttpClientConfig, 'baseUrl' | 'serviceName'> & {
		requestOptions?: Omit<
			HTTPClientRequestOptions,
			| 'accessToken'
			| 'path'
			| 'serviceName'
			| 'method'
			| 'headers'
			| 'body'
			| 'query'
			| 'pathParams'
		>;
	};
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

export type ApiClientResponse<T> = HTTPClientResponse<T, HTTPResponse<T>>;

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
	const { baseUrl, defaultHeaders, httpClientConfig } = config;
	const {
		requestOptions: defaultRequestOptions = {},
		defaultHeaders: httpClientDefaultHeaders,
		...sharedHttpClientConfig
	} = httpClientConfig ?? {};

	const hasDynamicDefaultHeaders =
		typeof defaultHeaders === 'function' ||
		typeof httpClientDefaultHeaders === 'function';

	const sharedDefaultHeaders = hasDynamicDefaultHeaders
		? async ({ accessToken }: { accessToken?: string }) => {
				const resolvedApiHeaders =
					typeof defaultHeaders === 'function'
						? await defaultHeaders()
						: defaultHeaders;
				const resolvedHttpClientHeaders =
					typeof httpClientDefaultHeaders === 'function'
						? await httpClientDefaultHeaders({ accessToken })
						: httpClientDefaultHeaders;

				return parseHeaders(
					mergeHeaders(resolvedHttpClientHeaders, resolvedApiHeaders),
					true
				);
			}
		: parseHeaders(
				mergeHeaders(httpClientDefaultHeaders, defaultHeaders),
				true
			);

	const client = createHttpClient({
		baseUrl,
		serviceName: 'api-client',
		...sharedHttpClientConfig,
		defaultHeaders: sharedDefaultHeaders,
	});

	return {
		client,
		/**
		 * Make a type-safe request to an endpoint from the route registry.
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
				headers?: HeadersInit;
			}
		): Promise<
			ApiClientResponse<
				ApplyResponseTypeTransformer<
					TTransformer,
					InferApi<TRegistry>[TPath]['endpoints'][TMethod]['response']
				>
			>
		> {
			type LocalResponse = ApplyResponseTypeTransformer<
				TTransformer,
				InferApi<TRegistry>[TPath]['endpoints'][TMethod]['response']
			>;

			const { method, params, body, query, headers = {} } = options;

			let endpoint: string;
			let requestHeaders: Record<string, string>;

			try {
				endpoint = interpolatePath(
					path,
					params as Record<string, string | number>
				);
				requestHeaders = parseHeaders(headers, true);
			} catch (error) {
				return {
					...parseError(
						error,
						'BAD_REQUEST',
						'Failed to construct request URL or headers'
					).toJSON(),
					raw: null,
				};
			}

			try {
				const response = await client.request<
					LocalResponse | { data: LocalResponse }
				>(path, {
					...defaultRequestOptions,
					method,
					credentials: defaultRequestOptions.credentials ?? 'include',
					headers: requestHeaders,
					body,
					query,
					pathParams: params as Record<string, string | number> | undefined,
					serviceName: endpoint,
				});

				if (!response.ok) {
					return response;
				}

				const normalizedData =
					response.statusCode === 204
						? (null as LocalResponse)
						: (response.data as LocalResponse);

				return {
					...response,
					data: normalizedData,
				};
			} catch (error) {
				return {
					...parseError(
						error,
						'REQUEST_FAILED',
						`Failed to execute request to ${endpoint}`
					).toJSON(),
					raw: null,
				};
			}
		},
	};
}

export type ApiClient<
	TRegistry extends RouteRegistry,
	TTransformer extends
		ResponseTypeTransformer = IdentityResponseTypeTransformer,
> = ReturnType<typeof createApiClient<TRegistry, TTransformer>>;
