import type { HTTPErrorFields } from './guards';
import { statusCodes } from './status-codes';
import type { HeadersInit, HTTPErrorResponse } from './types';

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

export class HTTPError extends Error {
	readonly ok = false;
	readonly statusCode: number;
	readonly statusText: string;
	readonly headers: HeadersInit;
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
			this.headers = statusCodeOrBody.headers ?? {};
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
			this.headers = headers ?? {};
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
