import { isRecord } from '../utils/records';
import { HTTPError } from './errors';
import type { HeadersInit, HTTPErrorResponse } from './types';

const NODE_ENV = process.env.NODE_ENV || 'development';

const isDetails = (
	value: unknown
): value is string | Record<string, unknown> => {
	return value === undefined || typeof value === 'string' || isRecord(value);
};

const isHeadersInit = (value: unknown): value is HeadersInit => {
	if (typeof Headers !== 'undefined' && value instanceof Headers) {
		return true;
	}

	if (Array.isArray(value)) {
		return value.every(
			(entry) =>
				Array.isArray(entry) &&
				entry.length === 2 &&
				typeof entry[0] === 'string' &&
				typeof entry[1] === 'string'
		);
	}

	return (
		isRecord(value) && Object.values(value).every((v) => typeof v === 'string')
	);
};

const hasHTTPErrorBody = (
	value: unknown
): value is HTTPErrorResponse['body'] => {
	return (
		isRecord(value) &&
		'code' in value &&
		typeof value.code === 'string' &&
		'message' in value &&
		typeof value.message === 'string' &&
		(!('details' in value) || isDetails(value.details))
	);
};

export const isHTTPError = (r: unknown): r is HTTPError => {
	return (
		r instanceof HTTPError ||
		(r instanceof Error &&
			isRecord(r) &&
			'ok' in r &&
			r.ok === false &&
			'statusCode' in r &&
			typeof r.statusCode === 'number' &&
			'headers' in r &&
			isHeadersInit(r.headers) &&
			'body' in r &&
			hasHTTPErrorBody(r.body))
	);
};

export const isHTTPErrorResponse = (r: unknown): r is HTTPErrorResponse => {
	return (
		isRecord(r) &&
		'ok' in r &&
		r.ok === false &&
		'statusCode' in r &&
		typeof r.statusCode === 'number' &&
		'body' in r &&
		hasHTTPErrorBody(r.body) &&
		(!('headers' in r) || r.headers === undefined || isHeadersInit(r.headers))
	);
};

export const parseError = (
	error: unknown,
	code: string,
	message: string
): HTTPError => {
	if (isHTTPError(error)) {
		return new HTTPError(error.statusCode, {
			code, // Note: Use specified code, not the one from the original error
			message: error.body.message,
			details: error.body.details,
		});
	}

	if (isHTTPErrorResponse(error)) {
		return new HTTPError(error.statusCode, {
			code, // Note: Use specified code, not the one from the error response
			message: error.body.message,
			details: error.body.details,
		});
	}

	if (error instanceof Error) {
		return new HTTPError(500, {
			code,
			message,
			details:
				NODE_ENV === 'production'
					? undefined
					: {
							message: error.message,
							stack: error.stack,
						},
		});
	}

	return new HTTPError(500, {
		code,
		message,
		details:
			NODE_ENV === 'production' ? undefined : JSON.stringify(error, null, 2),
	});
};
