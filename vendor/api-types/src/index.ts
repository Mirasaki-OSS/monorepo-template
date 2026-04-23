/**
 * Convenience re-exports for core types and client factory.
 * External repos can import everything they need from this single entry point.
 *
 * @example
 * ```typescript
 * import { createApiClient, type RouteRegistry } from "@md-oss/api-types";
 * ```
 */
export {
	type ApiClient,
	type ApiClientResponse,
	type ApplyResponseTypeTransformer,
	type ClientConfig,
	createApiClient,
	type IdentityResponseTypeTransformer,
	type JsonPrimitive,
	type JsonResponseTypeTransformer,
	parseHeaders,
	type ResponseTypeTransformer,
	type SerializedJson,
	stripProxyAndWebsocketHeaders,
} from './client';

export * from './debugger';

export {
	type ParameterParsingResult,
	type ParsedParameters,
	parseRequestParameters,
} from './params';

export type { ExtractResolvedContext, RequestOptions } from './request';

export {
	type ContextProvider,
	type ControllerFunction,
	type EndpointDefinitionSession,
	type IsUserMe,
	type RouteHandler,
	type SendTypedResponseOptions,
	type SignedAccessError,
	sendTypedResponse,
} from './response';

export {
	type EndpointDefinition,
	type InferApi,
	type MethodKeys,
	type PrefixRoutes,
	prefixRoutes,
	type RouteKeys,
	type RouteRegistry,
} from './types';
