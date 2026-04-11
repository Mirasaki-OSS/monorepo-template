export type HeadersInit =
	| Record<string, string>
	| Array<[string, string]>
	| Headers;

export type HTTPResponseFields = {
	/** The HTTP status code of the response. */
	statusCode: number;
	/** The HTTP status text of the response. */
	statusText: string;
	/** The HTTP headers of the response (normalized). */
	headers: Record<string, string>;
};

export type HTTPErrorFields = {
	/** Custom error codes, like `USER_NOT_FOUND`, `SUBSCRIPTION_EXPIRED`, etc. */
	code: string;
	/** A human-readable error message. */
	message: string;
	/**
	 * Additional error details that can be helpful for debugging. This can include
	 * any extra information about the error that doesn't fit into the `code` or `message` fields.
	 */
	details: null | Record<string, unknown>;
};

export type HTTPErrorResponse = HTTPResponseFields &
	HTTPErrorFields & {
		ok: false;
	};

export interface HTTPSuccessResponse<T> extends HTTPResponseFields {
	ok: true;
	/** The response body/data returned from the server. */
	data: T;
}

export type HTTPResponse<T> = HTTPSuccessResponse<T> | HTTPErrorResponse;
