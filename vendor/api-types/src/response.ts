import { type HTTPError, resolveStatusText } from '@md-oss/common/http/errors';
import type {
	MinimalRequest,
	MinimalRequestHandler,
	MinimalResponse,
} from '@md-oss/common/http/requests';
import type { HTTPSuccessResponse } from '@md-oss/common/http/types';
import { prettifyError, type ZodType } from 'zod/v4';
import { debugPerformance, debugRoute } from './debugger';
import { type ExtractResolvedContext, isZodSchema } from './request';
import type { InferApi, MethodKeys, RouteKeys, RouteRegistry } from './types';

type ResponseSchemas = {
	response?: unknown;
	responses?: Record<number | string, unknown>;
};

const resolveResponseSchema = (
	definitions: ResponseSchemas | undefined,
	statusCode: number
): ZodType | undefined => {
	if (!definitions) {
		return undefined;
	}

	const hasResponse = definitions.response !== undefined;
	const hasResponses = definitions.responses !== undefined;

	if (hasResponse && hasResponses) {
		throw new Error(
			'Endpoint definition cannot include both response and responses. Use exactly one.'
		);
	}

	if (hasResponses) {
		const statusMappedSchema = definitions.responses?.[String(statusCode)];
		if (isZodSchema(statusMappedSchema)) {
			return statusMappedSchema;
		}

		return undefined;
	}

	if (isZodSchema(definitions.response)) {
		return definitions.response;
	}

	return undefined;
};

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
	flattenResponse?: boolean;
	responseSchemas?: ResponseSchemas;
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
	) => Promise<true | HTTPError>;
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
			| HTTPError
			| SignedAccessError
			| Omit<
					SendTypedResponseOptions<Registry, API, TPath, TMethod>,
					'path' | 'method' | 'responseSchemas'
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
		flattenResponse = false,
		responseSchemas,
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

	// Note: Resolve early so response/response map exclusivity is enforced even for no-content responses.
	const responseSchema = resolveResponseSchema(responseSchemas, status);

	if (dataIsVoid || noContentStatusCodes.includes(status)) {
		debugRoute(
			'No response data to send, ending response with status %d',
			status
		);
		res.status(status).end();
		return;
	}

	if (responseSchema) {
		const parsedResponse = responseSchema.safeParse(data);

		if (!parsedResponse.success) {
			throw new Error(
				`Invalid response body for ${String(options.method)} ${String(options.path)}: ${prettifyError(parsedResponse.error)}`
			);
		}
	}

	if (flattenResponse) {
		debugRoute('Sending successful (flattened) response with body: %O', data);
		res.status(status).json(data);
		return;
	}

	const responseBody = {
		ok: true,
		statusCode: status,
		statusText: resolveStatusText(status),
		headers,
		data,
	} satisfies HTTPSuccessResponse<API[TPath]['endpoints'][TMethod]['response']>;

	debugRoute('Sending successful response with body: %O', responseBody);
	res.status(status).json(responseBody);
};

export {
	type ContextProvider,
	type ControllerFunction,
	type EndpointDefinitionSession,
	type GenericRouteHandler,
	type IsUserMe,
	noContentStatusCodes,
	type RouteHandler,
	resolveResponseSchema,
	type SendTypedResponseOptions,
	type SignedAccessError,
	sendTypedResponse,
};
