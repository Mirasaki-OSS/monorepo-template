import type { HeadersInit } from './types';

const strippedRequestHeaderNames = [
	'proxy-authorization',
	'proxy-authenticate',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'via',
	'connection',
	'host',
] as const;

export const mergeHeaders = (
	...headerSets: Array<HeadersInit | undefined>
): Headers => {
	const merged = new Headers();

	for (const headerSet of headerSets) {
		if (!headerSet) continue;

		new Headers(headerSet).forEach((value, key) => {
			merged.set(key, value);
		});
	}

	return merged;
};

export const normalizeHeaders = (
	headers: HeadersInit | undefined = {}
): Record<string, string> => {
	return Object.fromEntries(mergeHeaders(headers).entries());
};

export const stripProxyAndWebsocketHeaders = (
	headers: HeadersInit
): Record<string, string> => {
	const resolvedHeaders = normalizeHeaders(headers);

	for (const headerName of strippedRequestHeaderNames) {
		delete resolvedHeaders[headerName];
	}

	return resolvedHeaders;
};

export const parseHeaders = (
	headers: HeadersInit,
	shouldStripProxyAndWebsocketHeaders = true
): Record<string, string> => {
	return shouldStripProxyAndWebsocketHeaders
		? stripProxyAndWebsocketHeaders(headers)
		: normalizeHeaders(headers);
};
