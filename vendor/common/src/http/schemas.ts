import { z } from 'zod';

export const httpErrorResponseSchema = z.object({
	ok: z.literal(false),
	statusCode: z.number().int(),
	statusText: z.string(),
	headers: z.record(z.string(), z.string()),
	code: z.string(),
	message: z.string(),
	details: z.record(z.string(), z.unknown()).nullable(),
});

export const defaultHttpResponseEnvelope = <D extends z.ZodTypeAny>(data: D) =>
	z.object({
		ok: z.literal(true),
		data,
	});

export const extendDefaultHttpResponseEnvelope = <
	D extends z.ZodTypeAny,
	E extends z.ZodTypeAny,
>(
	envelopeShape: E,
	data: D
) => defaultHttpResponseEnvelope(data).extend(envelopeShape);
