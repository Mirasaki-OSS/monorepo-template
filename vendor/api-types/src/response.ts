import type { APIError, APISuccessResponse } from '@md-oss/common/api/errors';
import type {
	MinimalRequest,
	MinimalRequestHandler,
	MinimalResponse,
} from '@md-oss/common/api/requests';
import { debugPerformance, debugRoute } from './debugger';
import type { ExtractResolvedContext } from './request';
import type { InferApi, MethodKeys, RouteKeys, RouteRegistry } from './types';

type SignedAccessError =
	| 'MISSING_SIGNATURE'
	| 'INVALID_SIGNATURE'
	| 'EXPIRED_SIGNATURE';

type SendTypedResponseOptions<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
> = {
	path: TPath;
	method: TMethod;
	data: API[TPath]['endpoints'][TMethod]['response'];
	status?: number;
	headers?: Record<string, string>;
	message?: string;
	flattenResponse?: boolean;
};

type IsUserMe<T> = T extends { isUserMe: true } ? string : null;

type ContextProvider<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TConsumerSession,
	TConsumerContext = void,
> = ExtractResolvedContext<Registry, API, TPath, TMethod> & {
	session: EndpointDefinitionSession<
		Registry,
		API,
		TPath,
		TMethod,
		TConsumerSession
	>;
	endpoint: Registry[TPath]['endpoints'][TMethod];
	ctx: TConsumerContext;
	cps: <P extends API[TPath]['endpoints'][TMethod]['permissions'] | null>(
		resourceUserId: P extends null
			? IsUserMe<API[TPath]['endpoints'][TMethod]['permissions']>
			: IsUserMe<P>,
		policy?: P,
		session?: TConsumerSession | null,
		req?: MinimalRequest,
		res?: MinimalResponse
	) => Promise<true | APIError>;
};

type EndpointDefinitionSession<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TConsumerSession,
> = API[TPath]['endpoints'][TMethod]['permissions'] extends null
	? null | TConsumerSession
	: TConsumerSession;

type RouteHandler<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TConsumerSession,
	TConsumerContext = void,
	TRequestHandler = MinimalRequestHandler,
> = MinimalRequestHandler & {
	withContext: (
		ctx: Omit<
			ContextProvider<
				Registry,
				API,
				TPath,
				TMethod,
				TConsumerSession,
				TConsumerContext
			>,
			'cps' | 'session' | 'endpoint'
		>
	) => TRequestHandler;
};

type GenericRouteHandler<
	Registry extends RouteRegistry = RouteRegistry,
	API extends InferApi<Registry> = InferApi<Registry>,
	TPath extends RouteKeys<Registry> = RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath> = MethodKeys<Registry, TPath>,
	TConsumerContext = void,
> = RouteHandler<
	Registry,
	API,
	TPath,
	TMethod,
	unknown,
	TConsumerContext,
	MinimalRequestHandler
>;

type ControllerFunction<
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
	TConsumerSession,
	TConsumerContext = void,
	TRequestHandler = MinimalRequestHandler,
> = (
	context: ContextProvider<
		Registry,
		API,
		TPath,
		TMethod,
		TConsumerSession,
		TConsumerContext
	>,
	respond: (
		options:
			| APIError
			| SignedAccessError
			| Omit<
					SendTypedResponseOptions<Registry, API, TPath, TMethod>,
					'path' | 'method'
			  >
	) => void
) => TRequestHandler;

const noContentStatusCodes = [204, 205, 304];

const sendTypedResponse = <
	Registry extends RouteRegistry,
	API extends InferApi<Registry>,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
>(
	res: MinimalResponse,
	options: SendTypedResponseOptions<Registry, API, TPath, TMethod>
): void => {
	const dataIsVoid =
		options.data === undefined || typeof options.data === 'undefined'; // Null is explicit (non)data
	const {
		data,
		status = dataIsVoid ? 204 : 200,
		headers = {},
		message = null,
		flattenResponse = false,
	} = options;

	debugRoute(
		'Sending typed response for %s %s with status %d',
		options.method,
		options.path,
		status
	);
	debugPerformance(
		'Response data size: %d bytes',
		JSON.stringify(data)?.length || 0
	);

	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

	for (const [key, value] of Object.entries(headers)) {
		debugRoute('Setting custom header: %s = %s', key, value);
		res.setHeader(key, value);
	}

	if (dataIsVoid || noContentStatusCodes.includes(status)) {
		debugRoute(
			'No response data to send, ending response with status %d',
			status
		);
		res.status(status).end();
		return;
	}

	const responseBodyNoData = {
		ok: true,
		code: status,
		message,
	} as const;

	if (flattenResponse) {
		debugRoute(
			'Sending successful (flattened) response with message: %s',
			message || '(no message)'
		);
		res.status(status).json(data);
		return;
	}

	const responseBody = {
		...responseBodyNoData,
		data,
	} satisfies APISuccessResponse<API[TPath]['endpoints'][TMethod]['response']>;

	debugRoute(
		'Sending successful response with message: %s',
		message || '(no message)'
	);
	res.status(status).json(responseBody);
};

export {
	type SignedAccessError,
	type SendTypedResponseOptions,
	type IsUserMe,
	type ContextProvider,
	type EndpointDefinitionSession,
	type RouteHandler,
	type GenericRouteHandler,
	type ControllerFunction,
	sendTypedResponse,
};
