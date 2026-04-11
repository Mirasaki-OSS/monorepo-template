import createDebug from 'debug';
import pino, {
	multistream,
	type Logger as PinoLogger,
	type StreamEntry,
} from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export type LegacyLogLevel =
	| 'error'
	| 'warn'
	| 'info'
	| 'verbose'
	| 'debug'
	| 'silly';

export type LogTransport = 'console' | 'file' | 'both';

export type LogContext = Record<string, unknown>;

type LoggerMethod = (message: string, context?: LogContext) => void;

export type Logger = {
	trace: LoggerMethod;
	debug: LoggerMethod;
	info: LoggerMethod;
	warn: LoggerMethod;
	error: LoggerMethod;
	pino: pino.Logger<never, boolean>;
	createChildLogger: pino.Logger<never, boolean>['child'];
};

const LOG_LEVEL_WEIGHTS: Record<LogLevel, number> = {
	trace: 10,
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
};

const LOG_LEVELS = new Set<LogLevel>([
	'trace',
	'debug',
	'info',
	'warn',
	'error',
]);

const DEFAULT_LOG_LEVEL: LogLevel = 'info';
const DEFAULT_LOG_TRANSPORT: LogTransport = 'console';

const LEGACY_LEVEL_MAP: Record<LegacyLogLevel, LogLevel> = {
	error: 'error',
	warn: 'warn',
	info: 'info',
	verbose: 'debug',
	debug: 'debug',
	silly: 'trace',
};

const stringifyValue = (value: unknown): unknown => {
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
		};
	}

	if (typeof value === 'bigint') {
		return value.toString();
	}

	return value;
};

const safeStringify = (value: unknown) => {
	const seen = new WeakSet<object>();

	return JSON.stringify(value, (_key, currentValue) => {
		const normalized = stringifyValue(currentValue);

		if (typeof normalized === 'object' && normalized !== null) {
			if (seen.has(normalized)) {
				return '[Circular]';
			}
			seen.add(normalized);
		}

		return normalized;
	});
};

export const resolveLogLevel = (value?: string): LogLevel => {
	if (!value) {
		return DEFAULT_LOG_LEVEL;
	}

	const normalized = value.toLowerCase();

	if (normalized in LEGACY_LEVEL_MAP) {
		return LEGACY_LEVEL_MAP[normalized as LegacyLogLevel];
	}

	if (LOG_LEVELS.has(normalized as LogLevel)) {
		return normalized as LogLevel;
	}

	return DEFAULT_LOG_LEVEL;
};

export const resolveLegacyLogLevel = (value?: string): LegacyLogLevel => {
	if (!value) {
		return 'info';
	}

	const normalized = value.toLowerCase() as LegacyLogLevel;
	return normalized in LEGACY_LEVEL_MAP ? normalized : 'info';
};

export const resolveLogTransport = (value?: string): LogTransport => {
	if (!value) {
		return DEFAULT_LOG_TRANSPORT;
	}

	const normalized = value.toLowerCase();
	if (
		normalized === 'console' ||
		normalized === 'file' ||
		normalized === 'both'
	) {
		return normalized;
	}

	return DEFAULT_LOG_TRANSPORT;
};

const shouldLog = (activeLevel: LogLevel, targetLevel: LogLevel) => {
	return LOG_LEVEL_WEIGHTS[targetLevel] >= LOG_LEVEL_WEIGHTS[activeLevel];
};

const toDebugNamespace = (name: string) => {
	if (name.startsWith('grid-00:')) {
		return name;
	}

	return `grid-00:${name.replace(/\./g, ':')}`;
};

const resolveLogFilePath = () => {
	return process.env.LOG_FILE_PATH || 'logs/app.log';
};

const createStreams = (): StreamEntry[] => {
	const transport = resolveLogTransport(process.env.LOG_TRANSPORT);
	const streams: StreamEntry[] = [];

	if (transport === 'console' || transport === 'both') {
		streams.push({
			stream: pino.destination({
				dest: 1,
				sync: false,
			}),
		});
	}

	if (transport === 'file' || transport === 'both') {
		streams.push({
			stream: pino.destination({
				dest: resolveLogFilePath(),
				mkdir: true,
				sync: false,
			}),
		});
	}

	if (streams.length === 0) {
		streams.push({
			stream: pino.destination({
				dest: 1,
				sync: false,
			}),
		});
	}

	return streams;
};

const transports = createStreams();
const logLevel = resolveLegacyLogLevel(process.env.LOG_LEVEL);

let rootLogger: PinoLogger | undefined;

const getRootLogger = () => {
	if (rootLogger) {
		return rootLogger;
	}

	rootLogger = pino(
		{
			name: 'grid-00',
			level: 'trace',
			base: undefined,
			timestamp: pino.stdTimeFunctions.isoTime,
		},
		multistream(transports)
	);

	return rootLogger;
};

const logger = getRootLogger();

export const createLogger = ({
	name,
	level,
	debugNamespace,
}: {
	name: string;
	level?: LogLevel;
	debugNamespace?: string;
}): Logger => {
	const activeLevel = level ?? resolveLogLevel(process.env.LOG_LEVEL);
	const logger = getRootLogger().child({ logger: name });
	const debugLogger = createDebug(debugNamespace ?? toDebugNamespace(name));

	const write = (
		targetLevel: LogLevel,
		message: string,
		context?: LogContext
	) => {
		if (!shouldLog(activeLevel, targetLevel)) {
			return;
		}

		if (context) {
			logger[targetLevel](context, message);
		} else {
			logger[targetLevel](message);
		}

		if (debugLogger.enabled) {
			if (context) {
				debugLogger(
					`${targetLevel.toUpperCase()} ${message} ${safeStringify(context)}`
				);
			} else {
				debugLogger(`${targetLevel.toUpperCase()} ${message}`);
			}
		}
	};

	return {
		pino: logger,
		createChildLogger: logger.child.bind(logger),
		trace: (message, context) => write('trace', message, context),
		debug: (message, context) => write('debug', message, context),
		info: (message, context) => write('info', message, context),
		warn: (message, context) => write('warn', message, context),
		error: (message, context) => write('error', message, context),
	};
};

export type winston = {
	Logger: PinoLogger;
};

export { logger, logLevel, type PinoLogger, transports };
