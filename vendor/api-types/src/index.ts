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
	HTTPError,
	type IdentityResponseTypeTransformer,
	isHTTPError,
	isHTTPErrorResponse,
	type JsonPrimitive,
	type JsonResponseTypeTransformer,
	type JsonValueLike,
	parseHeaders,
	type ResponseTypeTransformer,
	type SerializedJson,
	serializeJson,
	stripProxyAndWebsocketHeaders,
} from './client';

export * from './debugger';

export {
	type ParameterParsingResult,
	type ParsedParameters,
	parseRequestParameters,
} from './params';
export {
	type ExtractResolvedContext,
	isZodSchema,
	type RequestOptions,
} from './request';

export {
	type ContextProvider,
	type ControllerFunction,
	type EndpointDefinitionSession,
	extendSendTypedResponse,
	type GenericRouteHandler,
	type IsUserMe,
	noContentStatusCodes,
	type RouteHandler,
	type SendTypedResponseDefaults,
	type SendTypedResponseExtension,
	type SendTypedResponseHandler,
	type SendTypedResponseOptions,
	type SignedAccessError,
	sendTypedResponse,
	withSendTypedResponseDefaults,
} from './response';

export {
	type EndpointDefinition,
	type EndpointResponseDefinition,
	type EndpointResponses,
	type InferApi,
	type MethodKeys,
	type PrefixRoutes,
	prefixRoutes,
	type RouteKeys,
	type RouteRegistry,
} from './types';
