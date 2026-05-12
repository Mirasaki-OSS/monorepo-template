import type { HeadersInit } from './types';

export const proxyAndWebsocketHeaders = [
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

export const defaultForwardedRequestHeaderNames = [
	'cookie',
	'x-forwarded-for',
	'x-real-ip',
	'cf-connecting-ip',
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

	for (const headerName of proxyAndWebsocketHeaders) {
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

export const pickAllowedRequestHeaders = (
	headers: HeadersInit | undefined,
	allowedHeaderNames: readonly string[] = defaultForwardedRequestHeaderNames
): Record<string, string> | undefined => {
	if (!headers) return undefined;

	const normalizedHeaders = normalizeHeaders(headers);
	const allowedHeaderNameSet = new Set(
		allowedHeaderNames.map((headerName) => headerName.toLowerCase())
	);
	const pickedHeaders = Object.fromEntries(
		Object.entries(normalizedHeaders).filter(([headerName]) =>
			allowedHeaderNameSet.has(headerName.toLowerCase())
		)
	);

	return Object.keys(pickedHeaders).length > 0 ? pickedHeaders : undefined;
};
