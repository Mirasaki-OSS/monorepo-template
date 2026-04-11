import { type HTTPErrorResponse, mergeHeaders } from '@md-oss/common/http';
import { UrlUtils } from '@md-oss/common/utils';
import { parseJson, stringifyJson } from '@md-oss/serdes';
import type { HttpRequestOptions, QueryValue } from './types';

const resolvePathParams = (
	path: string,
	pathParams?: Record<string, string | number>
): string => {
	if (!pathParams) return path;
	return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
		const value = pathParams[key];
		if (value === undefined || value === null) {
			throw new Error(`Missing path parameter: ${key}`);
		}
		return encodeURIComponent(String(value));
	});
};

const buildUrl = (baseUrl: string, path: string | null) =>
	UrlUtils.createUrlBuilder(baseUrl)(path ?? '');

const appendQuery = (
	url: string,
	query?: Record<string, QueryValue> | URLSearchParams
): string => {
	if (!query) return url;

	const [path, existing = ''] = url.split('?');
	const params = new URLSearchParams(existing);

	if (query instanceof URLSearchParams) {
		for (const [key, value] of query.entries()) {
			params.append(key, value);
		}
	} else {
		for (const [key, raw] of Object.entries(query)) {
			if (raw == null) continue;

			if (Array.isArray(raw)) {
				for (const item of raw) {
					if (item == null) continue;
					params.append(key, String(item));
				}
			} else {
				params.append(key, String(raw));
			}
		}
	}

	const qs = params.toString();
	return qs ? `${path}?${qs}` : path ? path : url;
};

const isBinaryBody = (
	body: unknown
): body is Blob | ArrayBuffer | ArrayBufferView => {
	return (
		body instanceof Blob ||
		body instanceof ArrayBuffer ||
		ArrayBuffer.isView(body)
	);
};

const isJsonBody = (body: unknown) => {
	if (body == null) return false;
	return !(
		typeof body === 'string' ||
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		isBinaryBody(body)
	);
};

const toBody = (body: unknown): BodyInit | undefined => {
	if (body == null) return undefined;
	if (
		typeof body === 'string' ||
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		isBinaryBody(body)
	) {
		return body as BodyInit;
	}
	return stringifyJson(body);
};

const resolveRequestHeaders = (
	headers: HeadersInit | undefined,
	body: unknown,
	parseAs: HttpRequestOptions['parseAs']
): Headers => {
	const resolved = mergeHeaders(headers);

	resolved.delete('content-length');

	if (parseAs === 'json' && !resolved.has('accept')) {
		resolved.set('accept', 'application/json');
	}

	if (isJsonBody(body) && !resolved.has('content-type')) {
		resolved.set('content-type', 'application/json');
	}

	return resolved;
};

const isErrorDetails = (
	value: unknown
): value is HTTPErrorResponse['details'] => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const parseErrorResponse = async (
	response: Response,
	fallback: string
): Promise<Pick<HTTPErrorResponse, 'code' | 'message' | 'details'>> => {
	try {
		const text = await response.clone().text();
		if (!text) {
			return {
				code: 'API_ERROR',
				message: fallback,
				details: null,
			};
		}

		try {
			const parsed = parseJson<Record<string, unknown>>(text);
			return {
				code: typeof parsed?.code === 'string' ? parsed.code : 'API_ERROR',
				message:
					typeof parsed?.message === 'string'
						? parsed.message
						: typeof parsed?.error === 'string'
							? parsed.error
							: fallback,
				details: isErrorDetails(parsed?.details) ? parsed.details : null,
			};
		} catch {
			return {
				code: 'API_ERROR',
				message: text,
				details: null,
			};
		}
	} catch {
		return {
			code: 'API_ERROR',
			message: fallback,
			details: null,
		};
	}
};

export {
	appendQuery,
	buildUrl,
	parseErrorResponse,
	resolvePathParams,
	resolveRequestHeaders,
	toBody,
};
