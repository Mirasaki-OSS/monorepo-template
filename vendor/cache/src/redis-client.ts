import debugFactory from 'debug';
import redis from 'redis';
import { env } from './env';

const logger = console;
const debug = debugFactory('md-oss:cache:redis');

const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = 60 * MS_IN_SECOND;

const { REDIS_URL } = env();

const redisClient: ReturnType<typeof redis.createClient> = redis.createClient({
	url: REDIS_URL,
	socket: {
		reconnectStrategy: (retries) => {
			logger.warn(`Redis connection lost, retrying... Attempt: ${retries}`);
			if (retries > 5) {
				logger.error(
					'Max retries reached, stopping Redis reconnection attempts'
				);
				return new Error('Max retries reached');
			}
			return Math.min(
				// Exponential backoff with a max of 30 seconds
				retries * MS_IN_SECOND,
				MS_IN_SECOND * 30
			);
		},
	},
});

const redisSetKv = (
	key: string,
	value: unknown,
	ttlInSeconds: number
): Promise<string | null> => {
	return redisClient.set(key, JSON.stringify(value), {
		condition: 'NX',
		expiration: {
			type: 'EX',
			value: ttlInSeconds,
		},
	});
};

const initializeRedis = async (): Promise<void> => {
	redisClient.on('error', (err) => {
		logger.error('Redis Client Error', err);
	});

	redisClient.on('ready', () => {
		logger.info('Redis client connected successfully');
	});

	try {
		await redisClient.connect();
	} catch (error) {
		logger.error('Error initializing Redis client:', error);
	}
};

const getRedisClient = (): typeof redisClient => {
	if (!redisClient.isOpen || !redisClient.isReady) {
		throw new Error('Redis client is not initialized or connected');
	}
	return redisClient;
};

type NotFunction = Exclude<unknown, (...args: unknown[]) => unknown>;
type LazyResolver<T extends NotFunction> = T | (() => Promise<T>);

const withRedis = async <T extends NotFunction>(
	prefix: string,
	key: string,
	callback: LazyResolver<T>,
	ttlInSeconds: number
): Promise<T> => {
	const client = getRedisClient();
	const fullKey = `${prefix}:${key}`;
	debug(`[REDIS] Executing operation for key: ${fullKey}`);

	if (typeof callback !== 'function') {
		debug(`[REDIS] Setting static value for key: ${prefix}:${key}`);
		const data = callback instanceof Promise ? await callback : callback;
		await redisSetKv(fullKey, data, ttlInSeconds);
		return data as T;
	}

	const cached = await client.get(fullKey);
	if (cached) {
		debug(`[REDIS] Cache hit for key: ${fullKey}`);
		return JSON.parse(cached) as T;
	} else {
		debug(`[REDIS] Cache miss for key: ${fullKey}`);
	}

	const data =
		typeof callback === 'function'
			? await (callback as () => Promise<T>)()
			: callback;
	if (data === null || data === undefined) {
		debug(`[REDIS] No data returned for key: ${fullKey}`);
		return null as T;
	}
	await redisSetKv(fullKey, data, ttlInSeconds);
	debug(`[REDIS] Data cached for key: ${fullKey}`);
	return data;
};

class RedisCacheManager<T> {
	constructor(
		private prefix: string,
		private callback: (key: string) => Promise<T>,
		private readonly ttlInSeconds: number = MS_IN_MINUTE * 5
	) {}

	async get(key: string): Promise<T> {
		return withRedis(
			this.prefix,
			key,
			async () => {
				return this.callback(key);
			},
			this.ttlInSeconds
		);
	}

	async set(
		key: string,
		value: T,
		ttlInSeconds: number = this.ttlInSeconds
	): Promise<T> {
		return withRedis(this.prefix, key, value, ttlInSeconds);
	}

	async delete(key: string): Promise<void> {
		const client = getRedisClient();
		const fullKey = `${this.prefix}:${key}`;
		await client.del(fullKey);
	}
}

// biome-ignore lint/complexity/noStaticOnlyClass: Namespace for grouping
class Redis {
	static readonly RedisCacheManager: typeof RedisCacheManager =
		RedisCacheManager;
	static readonly initialize: typeof initializeRedis = initializeRedis;
	static readonly getClient: typeof getRedisClient = getRedisClient;
	static readonly withRedis: typeof withRedis = withRedis;
}

export {
	Redis,
	RedisCacheManager,
	type LazyResolver,
	type NotFunction,
	redisSetKv,
	initializeRedis,
	getRedisClient,
	withRedis,
};
