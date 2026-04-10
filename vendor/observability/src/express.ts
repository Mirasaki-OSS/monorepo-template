import type { MinimalRequestHandler } from '@md-oss/common/http/requests';
import { parseJson } from '@md-oss/serdes';

export const expressRequestLoggingMiddleware = (
	logFunction: (msg: string, data?: unknown) => void
): MinimalRequestHandler => {
	return (req, res, next) => {
		const startTime = Date.now();
		const chunks: Buffer[] = [];

		logFunction(
			`[${new Date(startTime).toISOString()}] --> ${req.method} ${req.originalUrl}`
		);

		const originalWrite = res.write.bind(res);
		const originalEnd = res.end.bind(res);

		res.write = (chunk: unknown, ...args: unknown[]) => {
			if (chunk) {
				chunks.push(
					Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
				);
			}
			return originalWrite(
				chunk as Parameters<typeof originalWrite>[0],
				...(args as never[])
			);
		};

		res.end = (chunk: unknown, ...args: unknown[]) => {
			if (chunk) {
				chunks.push(
					Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
				);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;
			const body = Buffer.concat(chunks).toString('utf8');
			const size = Buffer.concat(chunks).length;

			const bodyTooLargeStr = '<too large to log>';
			let responseBody = size > 0 && size < 10000 ? body : bodyTooLargeStr;
			if (
				responseBody &&
				responseBody !== bodyTooLargeStr &&
				res.getHeader('content-type')?.toString().includes('json')
			) {
				try {
					responseBody = parseJson(body);
				} catch {
					// Unable to parse, leave as string
				}
			}

			logFunction(
				`[${new Date(endTime).toISOString()}] <-- ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms, ${size} bytes)`,
				responseBody
			);

			return originalEnd(chunk, ...(args as never[]));
		};

		next();
	};
};
