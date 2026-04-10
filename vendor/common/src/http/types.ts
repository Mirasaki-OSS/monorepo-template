export type HeadersInit =
	| Record<string, string>
	| Array<[string, string]>
	| Headers;

export type HTTPErrorResponse = {
	ok: false;
	statusCode: number;
	body: {
		code: string;
		message: string;
		details?: string | Record<string, unknown>;
	};
	headers?: HeadersInit;
};

export interface HTTPSuccessResponse<T> {
	ok: true;
	statusCode: number;
	message: string | null;
	data: T;
}

export type HTTPResponse<T> = HTTPSuccessResponse<T> | HTTPErrorResponse;
