import z from 'zod/v4';

const logLevelEnum = ['debug', 'info', 'warn', 'error'] as const;
const logLevelSchema = z.enum(logLevelEnum);

type LogLevel = z.infer<typeof logLevelSchema>;

export { type LogLevel, logLevelEnum, logLevelSchema };
