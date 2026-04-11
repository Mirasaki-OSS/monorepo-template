import { normalizeHeaders } from './headers';
import { statusCodes } from './status-codes';
import type {
	HeadersInit,
	HTTPErrorFields,
	HTTPErrorResponse,
	HTTPResponseFields,
} from './types';

export const resolveStatusText = (
	statusCode: number,
	statusCodesMap: Record<string, number> = statusCodes
): string => {
	const entry = Object.entries(statusCodesMap).find(
		([, code]) => code === statusCode
	)?.[0];

	if (!entry) {
		return `Error ${statusCode}`;
	}

	return entry
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

export class HTTPError extends Error implements HTTPResponseFields {
	readonly ok = false;
	readonly statusCode: number;
	readonly statusText: string;
	/**
	 * Headers that should be sent with the error response. Note that in a typical usage of `HTTPError`,
	 * the error lives on the server/API, and these are headers your web framework should set when responding.
	 * For example, if your endpoint controllers throws an error with `{ statusCode: 401, headers: { 'X-Something': 'value' } }`,
	 * your server should respond with a 401 status code and include the `X-Something: value` header in the response.
	 *
	 * Since these headers are meant to be consumed (sent as response headers), they are not included in the
	 * JSON representation of the error (i.e. the output of `toJSON()`), as this type is what arrives on the client side,
	 * and consumers can simply reference the response headers directly, which holds all headers, instead of only a specific subset.
	 */
	readonly headers: Record<string, string>;
	readonly body: HTTPErrorFields;

	constructor(body: CreateHTTPErrorOptions);
	constructor(statusCode: number, body: HTTPErrorFields, headers?: HeadersInit);
	constructor(
		statusCodeOrBody: number | CreateHTTPErrorOptions,
		body?: HTTPErrorFields,
		headers?: HeadersInit
	) {
		if (typeof statusCodeOrBody === 'object') {
			super(`[${statusCodeOrBody.code}]: ${statusCodeOrBody.message}`);
			this.statusCode = statusCodeOrBody.statusCode;
			this.statusText =
				statusCodeOrBody.statusText ??
				resolveStatusText(statusCodeOrBody.statusCode);
			this.headers = normalizeHeaders(statusCodeOrBody.headers ?? {});
			this.body = {
				code: statusCodeOrBody.code,
				message: statusCodeOrBody.message,
				details: statusCodeOrBody.details ?? null,
			};
		} else {
			if (!body) {
				throw new Error(
					'Body is required when using multi-argument constructor'
				);
			}

			super(`[${body.code}]: ${body.message}`);
			this.statusCode = statusCodeOrBody;
			this.statusText = resolveStatusText(statusCodeOrBody);
			this.headers = normalizeHeaders(headers ?? {});
			this.body = {
				code: body.code,
				message: body.message,
				details: body.details ?? null,
			};
		}

		this.name = 'HTTPError';
	}

	toJSON(): HTTPErrorResponse {
		return {
			ok: this.ok,
			statusCode: this.statusCode,
			statusText: this.statusText,
			code: this.body.code,
			message: this.body.message,
			details: this.body.details,
			headers: this.headers,
		} satisfies HTTPErrorResponse;
	}
}

export type CreateHTTPErrorOptions = HTTPErrorFields & {
	statusCode: number;
	statusText?: string;
	headers?: HeadersInit;
};

export function createHTTPError(options: CreateHTTPErrorOptions): HTTPError;
export function createHTTPError(
	statusCode: number,
	body: HTTPErrorFields,
	headers?: HeadersInit
): HTTPError;
export function createHTTPError(
	statusCodeOrOptions: number | CreateHTTPErrorOptions,
	body?: HTTPErrorFields,
	headers?: HeadersInit
): HTTPError {
	if (typeof statusCodeOrOptions === 'number') {
		if (!body) {
			throw new Error('Body is required when statusCode is provided');
		}

		return new HTTPError(statusCodeOrOptions, body, headers);
	}

	return new HTTPError(statusCodeOrOptions);
}

export function createHTTPErrorResponse(
	options: CreateHTTPErrorOptions
): HTTPErrorResponse;
export function createHTTPErrorResponse(
	statusCode: number,
	body: HTTPErrorFields,
	headers?: HeadersInit
): HTTPErrorResponse;
export function createHTTPErrorResponse(
	statusCodeOrOptions: number | CreateHTTPErrorOptions,
	body?: HTTPErrorFields,
	headers?: HeadersInit
): HTTPErrorResponse {
	if (typeof statusCodeOrOptions === 'number') {
		if (!body) {
			throw new Error('Body is required when statusCode is provided');
		}

		return new HTTPError(statusCodeOrOptions, body, headers).toJSON();
	}

	return new HTTPError(statusCodeOrOptions).toJSON();
}
