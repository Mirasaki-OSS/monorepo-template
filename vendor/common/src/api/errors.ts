import type { StatusCode } from './status-codes';

const { NODE_ENV } = process.env;

type APIErrorResponse = {
	ok: false;
	statusCode: StatusCode;
	body: {
		code: string;
		message: string;
		details?: string | Record<string, unknown>;
	};
	headers?: HeadersInit;
};

type HeadersInit = Record<string, string> | Array<[string, string]> | Headers;

class APIError extends Error {
	readonly ok = false;
	readonly statusCode: StatusCode;
	readonly headers: HeadersInit;
	readonly body: {
		code: string;
		message: string;
		details?: string | Record<string, unknown>;
	};

	constructor(body: {
		status: StatusCode;
		code: string;
		message: string;
		details?: string | Record<string, unknown>;
		headers?: HeadersInit;
	});
	constructor(
		statusCode: StatusCode,
		body: {
			code: string;
			message: string;
			details?: string | Record<string, unknown>;
		},
		headers?: HeadersInit
	);
	constructor(
		statusCodeOrBody:
			| StatusCode
			| {
					status: StatusCode;
					code: string;
					message: string;
					details?: string | Record<string, unknown>;
					headers?: HeadersInit;
			  },
		body?: {
			code: string;
			message: string;
			details?: string | Record<string, unknown>;
		},
		headers?: HeadersInit
	) {
		super();

		if (typeof statusCodeOrBody === 'object') {
			// Single argument signature
			this.statusCode = statusCodeOrBody.status;
			this.headers = statusCodeOrBody.headers ?? {};
			this.body = {
				code: statusCodeOrBody.code,
				message: statusCodeOrBody.message,
				details: statusCodeOrBody.details,
			};
		} else {
			// Multi-argument signature
			this.statusCode = statusCodeOrBody;
			this.headers = headers ?? {};
			this.body = body || {
				code: 'INTERNAL_SERVER_ERROR',
				message:
					'An error occurred, but no additional information is available.',
			};
		}

		this.message = `[${this.body.code}]: ${this.body.message}`;
	}

	toJSON(): APIErrorResponse {
		return {
			ok: this.ok,
			statusCode: this.statusCode,
			body: this.body,
			headers: this.headers,
		} satisfies APIErrorResponse;
	}
}

//
// Start Guards
//

interface APISuccessResponse<T> {
	ok: true;
	code: number;
	message: string | null;
	data: T;
}

const isAPIError = (r: unknown): r is APIError => {
	if (r instanceof APIError) {
		return true;
	}

	if (isAPIErrorResponse(r)) {
		r = new APIError(r.statusCode, {
			code: r.body.code,
			message: r.body.message,
			details: r.body.details,
		});
		return true;
	}

	return false;
};

const isAPIErrorResponse = (r: unknown): r is APIErrorResponse => {
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

/**
 * Parses an unknown error into a standardized APIError. The provided code and message
 * will be used for the resulting APIError, while details from the original error
 * will be included when not in production mode.
 */
const parseError = (
	error: unknown,
	code: string,
	message: string
): APIError => {
	if (isAPIError(error)) {
		return new APIError(error.statusCode, {
			code,
			message: error.body.message,
			details: error.body.details,
		});
	}

	if (isAPIErrorResponse(error)) {
		return new APIError(error.statusCode, {
			code,
			message: error.body.message,
			details: error.body.details,
		});
	}

	if (error instanceof Error) {
		return new APIError(500, {
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

	return new APIError(500, {
		code,
		message,
		details:
			NODE_ENV === 'production' ? undefined : JSON.stringify(error, null, 2),
	});
};

export {
	APIError,
	type APIErrorResponse,
	type APISuccessResponse,
	isAPIError,
	isAPIErrorResponse,
	parseError,
};
