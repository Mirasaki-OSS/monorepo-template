import z from 'zod/v4';

const unknownRecordSchema = z.record(z.string(), z.unknown()).catch({});

type UnknownRecord = z.infer<typeof unknownRecordSchema>;

export { type UnknownRecord, unknownRecordSchema };
