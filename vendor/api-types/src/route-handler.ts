import {
	APIError,
	isAPIErrorResponse,
	parseError,
} from '@md-oss/common/api/errors';
import type {
	MinimalRequest,
	MinimalRequestHandler,
	MinimalResponse,
} from '@md-oss/common/api/requests';
import { statusCodes } from '@md-oss/common/api/status-codes';
import { debugErrors, debugPerformance, debugRoute } from './debugger';
import { type ParsedParameters, parseRequestParameters } from './params';
import {
	type ContextProvider,
	type ControllerFunction,
	type RouteHandler,
	type SendTypedResponseOptions,
	type SignedAccessError,
	sendTypedResponse,
} from './response';
import type { InferApi, MethodKeys, RouteKeys, RouteRegistry } from './types';

export function parseSignedAccessError(
	error: APIError | SignedAccessError
): APIError {
	if (isAPIErrorResponse(error)) {
		debugErrors(
			'#parseSignedAccessError Returning existing APIError: %s - %s',
			error.statusCode,
			error.message
		);
		return error;
	}

	debugErrors(
		'#parseSignedAccessError Converting signed access error to APIError: %s',
		error
	);
	return new APIError(statusCodes.FORBIDDEN, {
		code: 'SIGNED_ACCESS_ERROR',
		message: 'Signed access verification failed.',
		details: {
			error,
		},
	});
}

export function generateRequestId(): string {
	return Math.random().toString(36).substring(2, 15);
}

/**
 * Authentication result from resolving session/authentication for a request.
 */
export interface AuthResult<TSession> {
	session: TSession | null;
	error?: APIError;
}

/**
 * Permission tracker interface for monitoring permission checks.
 */
export interface PermissionTracker {
	cpsCalled: boolean;
	didTrackCps: boolean;
}

/**
 * Strategy interface for authentication resolution.
 * Implement this to provide custom authentication logic.
 */
export interface AuthStrategy<TSession, TEndpoint> {
	/**
	 * Resolve authentication for the request.
	 * @param req - The incoming request
	 * @param res - The response object
	 * @param endpoint - The endpoint definition
	 * @param requestId - Unique request identifier for logging
	 * @param path - The route path
	 * @param method - The HTTP method
	 * @returns Authentication result with session or error
	 */
	resolveAuthentication(
		req: MinimalRequest,
		res: MinimalResponse,
		endpoint: TEndpoint,
		requestId: string,
		path: string,
		method: string
	): Promise<AuthResult<TSession>>;
}

/**
 * Strategy interface for building request context.
 * Implement this to provide custom context building logic.
 */
export interface ContextBuildStrategy<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TSession,
	TConsumerContext,
> {
	/**
	 * Build the context for the controller.
	 * @param session - The resolved session (or null for public endpoints)
	 * @param endpoint - The endpoint definition
	 * @param parsedParams - Parsed request parameters (params, query, body)
	 * @param injectedContext - Pre-built context to merge (for .withContext())
	 * @param req - The incoming request
	 * @param res - The response object
	 * @param requestId - Unique request identifier for logging
	 * @param permissionTracker - Permission tracking state
	 * @returns Fully resolved context for the controller
	 */
	buildContext(
		session: TSession | null,
		endpoint: Registry[TPath]['endpoints'][TMethod],
		parsedParams: ParsedParameters | undefined,
		injectedContext:
			| Omit<
					ContextProvider<
						Registry,
						API,
						TPath,
						TMethod,
						TSession,
						TConsumerContext
					>,
					'cps' | 'session' | 'endpoint'
			  >
			| undefined,
		req: MinimalRequest,
		res: MinimalResponse,
		requestId: string,
		permissionTracker: PermissionTracker
	): Promise<
		ContextProvider<Registry, API, TPath, TMethod, TSession, TConsumerContext>
	>;
}

/**
 * Strategy interface for permission tracking setup.
 * Implement this to provide custom permission tracking logic.
 */
export interface PermissionTrackingStrategy<TEndpoint> {
	/**
	 * Setup permission tracking for the request.
	 * @param endpoint - The endpoint definition (contains permissions config)
	 * @param res - The response object (for attaching cleanup hooks)
	 * @param requestId - Unique request identifier for logging
	 * @param startTime - Request start timestamp
	 * @param permissionTracker - Permission tracking state to update
	 * @param path - The route path
	 * @param method - The HTTP method
	 */
	setupPermissionTracking(
		endpoint: TEndpoint,
		res: MinimalResponse,
		requestId: string,
		startTime: number,
		permissionTracker: PermissionTracker,
		path: string,
		method: string
	): void;
}

/**
 * Generic route handler factory.
 * This function creates a route handler that:
 * 1. Resolves authentication via the provided strategy
 * 2. Parses request parameters (params, query, body)
 * 3. Builds context via the provided strategy
 * 4. Calls the controller with the context
 * 5. Handles responses and errors
 *
 * @param routeDef - The route definition from the registry
 * @param path - The route path
 * @param method - The HTTP method
 * @param controller - The controller function
 * @param authStrategy - Authentication resolution strategy
 * @param contextStrategy - Context building strategy
 * @param permissionStrategy - Permission tracking strategy (optional)
 * @param injectedContext - Pre-built context for .withContext() calls
 * @returns A route handler with .withContext() support
 */
export function createGenericRouteHandler<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TSession,
	TConsumerContext = void,
	TRequestHandler = MinimalRequestHandler,
>(
	routeDef: Registry[TPath],
	path: TPath,
	method: TMethod,
	controller: ControllerFunction<
		Registry,
		API,
		TPath,
		TMethod,
		TSession,
		TConsumerContext,
		TRequestHandler
	>,
	authStrategy: AuthStrategy<TSession, Registry[TPath]['endpoints'][TMethod]>,
	contextStrategy?: ContextBuildStrategy<
		Registry,
		API,
		TPath,
		TMethod,
		TSession,
		TConsumerContext
	>,
	permissionStrategy?: PermissionTrackingStrategy<
		Registry[TPath]['endpoints'][TMethod]
	>,
	injectedContext?: Omit<
		ContextProvider<Registry, API, TPath, TMethod, TSession, TConsumerContext>,
		'cps' | 'session' | 'endpoint'
	>
): RouteHandler<
	Registry,
	API,
	TPath,
	TMethod,
	TSession,
	TConsumerContext,
	TRequestHandler
> {
	const endpoint = routeDef.endpoints[
		method as keyof typeof routeDef.endpoints
	] as Registry[TPath]['endpoints'][TMethod];

	const wrapper: MinimalRequestHandler = async (
		req: MinimalRequest,
		res: MinimalResponse,
		next
	) => {
		const startTime = Date.now();
		const requestId = generateRequestId();

		debugRoute(
			'[%s] Starting route handler for %s %s',
			requestId,
			method,
			path
		);
		debugPerformance('[%s] Route handler start time: %d', requestId, startTime);

		try {
			debugRoute(
				'[%s] Route definition found, permissions required: %s',
				requestId,
				endpoint.permissions ? 'yes' : 'no'
			);

			// Resolve authentication
			const authResult = await authStrategy.resolveAuthentication(
				req,
				res,
				endpoint,
				requestId,
				path as string,
				method as string
			);

			if (authResult.error) {
				return next(authResult.error);
			}

			// Setup permission tracking
			const permissionTracker: PermissionTracker = {
				cpsCalled: false,
				didTrackCps: false,
			};

			if (permissionStrategy) {
				permissionStrategy.setupPermissionTracking(
					endpoint,
					res,
					requestId,
					startTime,
					permissionTracker,
					path as string,
					method as string
				);
			}

			// Parse parameters if not using injected context
			let parsedParams: Awaited<
				ReturnType<typeof parseRequestParameters>
			>['data'];
			if (!injectedContext) {
				const paramResult = await parseRequestParameters(
					req,
					requestId,
					path,
					method,
					endpoint,
					routeDef
				);

				if (!paramResult.success) {
					return next(paramResult.error);
				}

				parsedParams = paramResult.data;
			}

			// Build context
			const resolvedContext = await contextStrategy?.buildContext(
				authResult.session,
				endpoint,
				parsedParams,
				injectedContext,
				req,
				res,
				requestId,
				permissionTracker
			);

			debugRoute('[%s] Calling controller', requestId);

			const fallbackContext = (): ContextProvider<
				Registry,
				API,
				TPath,
				TMethod,
				TSession,
				TConsumerContext
			> => {
				if (!parsedParams) {
					throw new Error(
						'Either injectedContext or parsedParams must be provided'
					);
				}

				const cpsThrowNoCtx = () => {
					throw new Error('CPS function called without context');
				};

				const cpsFn = cpsThrowNoCtx as ContextProvider<
					Registry,
					API,
					TPath,
					TMethod,
					TSession,
					TConsumerContext
				>['cps'];

				const resolvedSession = authResult.session;

				return {
					cps: cpsFn,
					endpoint,
					session: resolvedSession,
					params: parsedParams.params ?? {},
					query: parsedParams.query ?? {},
					body: parsedParams.body ?? {},
					ctx: undefined as TConsumerContext,
				} as unknown as ContextProvider<
					Registry,
					API,
					TPath,
					TMethod,
					TSession,
					TConsumerContext
				>;
			};

			// Call controller with respond callback
			const handler = controller(
				resolvedContext || fallbackContext(),
				(options) => {
					if (isAPIErrorResponse(options) || typeof options === 'string') {
						debugErrors(
							'[%s] Controller responded with error: %o',
							requestId,
							options
						);
						return next(parseSignedAccessError(options));
					}
					debugRoute('[%s] Controller responded with success', requestId);
					sendTypedResponse(res, {
						path,
						method,
						...options,
					} as SendTypedResponseOptions<Registry, API, TPath, TMethod>);
				}
			);

			if (typeof handler !== 'function') {
				const errorMsg = `Controller for ${String(method)} ${String(path)} did not return a valid handler`;
				debugErrors('[%s] %s', requestId, errorMsg);
				throw new Error(errorMsg);
			}

			debugRoute('[%s] Executing handler function', requestId);
			return handler(req, res, next);
		} catch (error) {
			const errorDuration = Date.now() - startTime;
			debugErrors(
				'[%s] Route handler error after %dms: %o',
				requestId,
				errorDuration,
				error
			);

			next(
				parseError(
					error,
					'ROUTE_HANDLER_ERROR',
					'An error occurred while processing the request.'
				)
			);
		}
	};

	const handlerWithInject = wrapper as RouteHandler<
		Registry,
		API,
		TPath,
		TMethod,
		TSession,
		TConsumerContext,
		TRequestHandler
	>;

	handlerWithInject.withContext = (ctx) => {
		return createGenericRouteHandler(
			routeDef,
			path,
			method,
			controller,
			authStrategy,
			contextStrategy,
			permissionStrategy,
			ctx
		) as TRequestHandler;
	};

	return handlerWithInject;
}

export type RouteMethodBuilder<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TSession,
	TConsumerContext = void,
	TRequestHandler = MinimalRequestHandler,
> = (
	controller: ControllerFunction<
		Registry,
		API,
		TPath,
		TMethod,
		TSession,
		TConsumerContext,
		TRequestHandler
	>
) => RouteHandler<
	Registry,
	API,
	TPath,
	TMethod,
	TSession,
	TConsumerContext,
	TRequestHandler
>;

/**
 * Generic controller factory.
 * Creates a method builder that binds to a specific route and HTTP method.
 *
 * @param registry - The route registry
 * @param path - The route path
 * @param method - The HTTP method
 * @param authStrategy - Authentication resolution strategy
 * @param contextStrategy - Context building strategy
 * @param permissionStrategy - Permission tracking strategy (optional)
 * @returns A function that takes a controller and returns a route handler
 */
export function createGenericController<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TSession,
	TConsumerContext = void,
	TRequestHandler = MinimalRequestHandler,
>(
	registry: Registry,
	path: TPath,
	method: TMethod,
	authStrategy: AuthStrategy<TSession, Registry[TPath]['endpoints'][TMethod]>,
	contextStrategy?: ContextBuildStrategy<
		Registry,
		API,
		TPath,
		TMethod,
		TSession,
		TConsumerContext
	>,
	permissionStrategy?: PermissionTrackingStrategy<
		Registry[TPath]['endpoints'][TMethod]
	>
): RouteMethodBuilder<
	Registry,
	API,
	TPath,
	TMethod,
	TSession,
	TConsumerContext,
	TRequestHandler
> {
	const routeDef = registry[path] as unknown as Registry[TPath];

	return (controller) => {
		return createGenericRouteHandler<
			Registry,
			API,
			TPath,
			TMethod,
			TSession,
			TConsumerContext,
			TRequestHandler
		>(
			routeDef,
			path,
			method,
			controller,
			authStrategy,
			contextStrategy,
			permissionStrategy
		);
	};
}
