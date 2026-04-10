export type HeadersInit =
	| Record<string, string>
	| Array<[string, string]>
	| Headers;

export type HTTPErrorResponse = {
	ok: false;
	statusCode: number;
	statusText: string;
	/** Custom error codes, like `USER_NOT_FOUND`, `SUBSCRIPTION_EXPIRED`, etc. */
	code: string;
	message: string;
	details: null | Record<string, unknown>;
};

export interface HTTPSuccessResponse<T> {
	ok: true;
	data: T;
}

export type HTTPResponse<T> = HTTPSuccessResponse<T> | HTTPErrorResponse;
