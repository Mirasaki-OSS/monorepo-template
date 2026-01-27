import path from 'node:path';
import winston from 'winston';
import { env } from './env';

const { LOG_DIR, LOG_LEVEL, LOG_TO_CONSOLE } = env();

const TEN_MEGABYTES = 10 * 1024 * 1024;
const { combine, timestamp, json, errors, splat, colorize, simple } =
	winston.format;

const transports: winston.transport[] = [];
const logLevel: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly' =
	LOG_LEVEL || 'info';

const consoleTransport = () =>
	new winston.transports.Console({
		format: combine(
			colorize(),
			timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			errors({ stack: true }),
			splat(),
			simple()
		),
		level: logLevel,
	});

if (LOG_DIR) {
	const resolvedPath = path.join(process.cwd(), LOG_DIR);
	transports.push(
		new winston.transports.File({
			filename: path.join(resolvedPath, 'errors.log'),
			level: 'error',
			maxsize: TEN_MEGABYTES,
			maxFiles: 3,
			dirname: resolvedPath,
		}),
		new winston.transports.File({
			filename: path.join(resolvedPath, 'combined.log'),
			maxsize: TEN_MEGABYTES,
			maxFiles: 7,
			dirname: resolvedPath,
		})
	);
}

if (LOG_TO_CONSOLE) {
	transports.push(consoleTransport());
}

const logger: winston.Logger = winston.createLogger({
	level: logLevel,
	format: combine(
		timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		errors({ stack: true }),
		splat(),
		json()
	),
	transports,
	defaultMeta: {
		service: process.env.npm_package_name || 'unknown',
		version: process.env.npm_package_version || 'unknown',
	},
	exceptionHandlers: [
		consoleTransport(),
		new winston.transports.File({
			filename: path.join(LOG_DIR || '', 'exceptions.log'),
		}),
	],
	rejectionHandlers: [
		consoleTransport(),
		new winston.transports.File({
			filename: path.join(LOG_DIR || '', 'rejections.log'),
		}),
	],
});

const createChildLogger = (meta: Record<string, unknown>): winston.Logger => {
	return logger.child(meta);
};

export { logger, logLevel, type winston, transports, createChildLogger };
