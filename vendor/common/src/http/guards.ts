import { HTTPError } from './errors';
import type { HTTPErrorResponse } from './types';

const NODE_ENV = process.env.NODE_ENV || 'development';

export const isHTTPError = (r: unknown): r is HTTPError => {
	if (r instanceof HTTPError) {
		return true;
	}

	if (isHTTPErrorResponse(r)) {
		r = new HTTPError(r.statusCode, {
			code: r.body.code,
			message: r.body.message,
			details: r.body.details,
		});
		return true;
	}

	return false;
};

export const isHTTPErrorResponse = (r: unknown): r is HTTPErrorResponse => {
	return (
		typeof r === 'object' &&
		r !== null &&
		'ok' in r &&
		r.ok === false &&
		'statusCode' in r &&
		typeof r.statusCode === 'number' &&
		'body' in r &&
		typeof r.body === 'object' &&
		r.body !== null &&
		'code' in r.body &&
		typeof r.body.code === 'string' &&
		'message' in r.body &&
		typeof r.body.message === 'string'
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
