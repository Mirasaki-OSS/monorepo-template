import { isRecord } from '../utils/records';
import { HTTPError } from './errors';
import type { HeadersInit, HTTPErrorFields, HTTPErrorResponse } from './types';

const isDetails = (value: unknown): value is HTTPErrorResponse['details'] => {
	return value === null || isRecord(value);
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

const hasHTTPErrorFields = (value: unknown): value is HTTPErrorFields => {
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
			'statusText' in r &&
			typeof r.statusText === 'string' &&
			hasHTTPErrorFields(r) &&
			(!('headers' in r) ||
				r.headers === undefined ||
				isHeadersInit(r.headers)))
	);
};

export const isHTTPErrorResponse = (r: unknown): r is HTTPErrorResponse => {
	return (
		isRecord(r) &&
		'ok' in r &&
		r.ok === false &&
		'statusCode' in r &&
		typeof r.statusCode === 'number' &&
		'statusText' in r &&
		typeof r.statusText === 'string' &&
		hasHTTPErrorFields(r) &&
		(!('headers' in r) || r.headers === undefined || isHeadersInit(r.headers))
	);
};

export const parseError = (
	error: unknown,
	code: string,
	message: string
): HTTPError => {
	if (isHTTPError(error)) {
		return new HTTPError({
			statusCode: error.statusCode,
			statusText: error.statusText,
			code, // Note: Use specified code, not the one from the original error
			message: error.body.message,
			details: error.body.details,
			headers: error.headers,
		});
	}

	if (isHTTPErrorResponse(error)) {
		return new HTTPError({
			statusCode: error.statusCode,
			statusText: error.statusText,
			code, // Note: Use specified code, not the one from the error response
			message: error.message,
			details: error.details,
			headers:
				isRecord(error) &&
				'headers' in error &&
				(error.headers === undefined || isHeadersInit(error.headers))
					? error.headers
					: undefined,
		});
	}

	const { NODE_ENV } = process.env;

	if (error instanceof Error) {
		return new HTTPError(500, {
			code,
			message,
			details:
				NODE_ENV === 'production'
					? null
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
			NODE_ENV === 'production'
				? null
				: {
						value: JSON.stringify(error, null, 2),
					},
	});
};
