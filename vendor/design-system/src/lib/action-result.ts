import {
	type HTTPError,
	type HTTPErrorResponse,
	isHTTPError,
	isHTTPErrorResponse,
	parseError,
} from '@md-oss/common/http';

type ActionResult<T = unknown> =
	| {
			ok: false;
			error: HTTPErrorResponse;
	  }
	| {
			ok: true;
			data: T;
	  };

type ActionErrorOptions = {
	code?: string;
	message: string;
};

async function withActionResult<T>(
	request: () => Promise<
		Exclude<T, HTTPErrorResponse> | HTTPError | HTTPErrorResponse
	>,
	errorOptions: ActionErrorOptions
): Promise<ActionResult<T>> {
	'use server';

	try {
		const response = await request();

		if (isHTTPErrorResponse(response)) {
			return {
				ok: false,
				error: response,
			};
		}

		return {
			ok: true,
			data: isHTTPError(response) ? (response.toJSON() as T) : response,
		};
	} catch (error) {
		return {
			ok: false,
			error: parseError(
				error,
				errorOptions.code ?? 'INTERNAL_SERVER_ERROR',
				errorOptions.message
			).toJSON(),
		};
	}
}

export { type ActionErrorOptions, type ActionResult, withActionResult };
