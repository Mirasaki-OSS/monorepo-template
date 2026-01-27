import { APIError } from '@md-oss/common/api/errors';
import type { MinimalRequest } from '@md-oss/common/api/requests';
import { statusCodes } from '@md-oss/common/api/status-codes';
import { prettifyError } from 'zod/v4';
import { debugErrors, debugPerformance, debugRoute } from './debugger';
import type { MethodKeys, RouteKeys, RouteRegistry } from './types';

export interface ParsedParameters {
	params?: unknown;
	query?: unknown;
	body?: unknown;
}

export interface ParameterParsingResult {
	success: boolean;
	data?: ParsedParameters;
	error?: APIError;
}

export async function parseRequestParameters<
	Registry extends RouteRegistry,
	TPath extends RouteKeys<Registry>,
	TMethod extends MethodKeys<Registry, TPath>,
>(
	req: MinimalRequest,
	requestId: string,
	path: TPath,
	method: TMethod,
	endpoint: Registry[TPath]['endpoints'][TMethod],
	routeDef: Registry[TPath]
): Promise<ParameterParsingResult> {
	debugRoute('[%s] Parsing request parameters', requestId);
	const parseStart = Date.now();

	const [params, query, body] = await Promise.all([
		'params' in routeDef && routeDef.params
			? routeDef.params.safeParseAsync(req.params)
			: Promise.resolve(),
		'query' in endpoint && endpoint.query
			? endpoint.query.safeParseAsync(req.query)
			: Promise.resolve(),
		'body' in endpoint && endpoint.body
			? endpoint.body.safeParseAsync(req.body)
			: Promise.resolve(),
	]);

	const parseEnd = Date.now();
	debugPerformance(
		'[%s] Parameter parsing took %dms',
		requestId,
		parseEnd - parseStart
	);

	if (params?.error || query?.error || body?.error) {
		debugErrors('[%s] Parameter validation failed', requestId);
		debugErrors('[%s] Params errors: %o', requestId, {
			params: req.params,
			issues: params?.error?.issues,
		});
		debugErrors('[%s] Query errors: %o', requestId, {
			query: req.query,
			issues: query?.error?.issues,
		});
		debugErrors('[%s] Body errors: %o', requestId, {
			body: req.body,
			issues: body?.error?.issues,
		});

		return {
			success: false,
			error: new APIError(statusCodes.BAD_REQUEST, {
				code: body?.error?.issues.length
					? 'INVALID_REQUEST_BODY'
					: query?.error?.issues.length
						? 'INVALID_REQUEST_QUERY'
						: params?.error?.issues.length
							? 'INVALID_REQUEST_PARAMETERS'
							: 'INVALID_REQUEST',
				message: body?.error?.issues.length
					? `Invalid request body: ${prettifyError(body.error)}`
					: query?.error?.issues.length
						? `Invalid request query: ${prettifyError(query.error)}`
						: params?.error?.issues.length
							? `Invalid request parameters: ${prettifyError(params.error)}`
							: `Invalid request to ${String(method)} ${String(path)}`,
				details: {
					requestId,
					params: params?.error?.issues,
					query: query?.error?.issues,
					body: body?.error?.issues,
				},
			}),
		};
	}

	debugRoute('[%s] Parameters validated successfully', requestId);

	return {
		success: true,
		data: {
			params: params?.data ?? {},
			query: query?.data ?? {},
			body: body?.data ?? {},
		},
	};
}
