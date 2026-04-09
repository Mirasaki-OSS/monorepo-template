import z from 'zod/v4';

const logLevelEnum = ['debug', 'info', 'warn', 'error'] as const;
const logLevelSchema = z
	.enum(logLevelEnum)
	.default(process.env.NODE_ENV === 'development' ? 'debug' : 'info');
type LogLevel = z.infer<typeof logLevelSchema>;

export { type LogLevel, logLevelEnum, logLevelSchema };
