/**
 * Convenience re-exports for core types and client factory.
 * External repos can import everything they need from this single entry point.
 *
 * @example
 * ```typescript
 * import { createApiClient, type RouteRegistry } from "@md-oss/api-types";
 * ```
 */
export { type ApiClient, createApiClient, parseHeaders } from './client';

export * from './debugger';

export {
	type ParameterParsingResult,
	type ParsedParameters,
	parseRequestParameters,
} from './params';

export type {
	ExtractResolvedContext,
	RequestOptions,
} from './request';

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

export type {
	EndpointDefinition,
	InferApi,
	MethodKeys,
	PrefixRoutes,
	RouteKeys,
	RouteRegistry,
} from './types';

export { prefixRoutes } from './types';
