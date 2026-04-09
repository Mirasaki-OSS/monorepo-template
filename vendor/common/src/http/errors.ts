import type { HTTPErrorResponse } from './types';

export class HTTPError extends Error {
	readonly ok = false;
	readonly statusCode: number;
	readonly headers: HeadersInit;
	readonly body: {
		code: string;
		message: string;
		details?: string | Record<string, unknown>;
	};

	constructor(body: {
		statusCode: number;
		code: string;
		message: string;
		details?: string | Record<string, unknown>;
		headers?: HeadersInit;
	});
	constructor(
		statusCode: number,
		body: {
			code: string;
			message: string;
			details?: string | Record<string, unknown>;
		},
		headers?: HeadersInit
	);
	constructor(
		statusCodeOrBody:
			| number
			| {
					statusCode: number;
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
			this.statusCode = statusCodeOrBody.statusCode;
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
			if (!body) {
				throw new Error(
					'Body is required when using multi-argument constructor'
				);
			}
			this.body = body;
		}

		this.message = `[${this.body.code}]: ${this.body.message}`;
	}

	toJSON(): HTTPErrorResponse {
		return {
			ok: this.ok,
			statusCode: this.statusCode,
			body: this.body,
			headers: this.headers,
		} satisfies HTTPErrorResponse;
	}
}
