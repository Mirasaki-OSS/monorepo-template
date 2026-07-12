import { getRedisClient, initializeRedis } from '@md-oss/cache';
import { TimeMagic } from '@md-oss/common/constants/time';
import { statusCodes } from '@md-oss/common/http/status-codes';
import type { Context, MiddlewareHandler } from 'hono';
import { parsedEnv } from '../env';

const isAuthPolicyEnabled = false; // Note: Better-auth implements its own rate-limiting.

type RateLimitPolicy = {
	max: number;
	enabled: boolean;
	windowSeconds: number;
	keyPrefix: string;
};

type RateLimitResult = {
	allowed: boolean;
	limit: number;
	remaining: number;
	retryAfterSeconds: number;
};

const localStore = new Map<string, { count: number; resetAt: number }>();
let redisInitPromise: Promise<void> | null = null;

const ensureRedisInitialized = async (): Promise<boolean> => {
	if (!redisInitPromise) {
		redisInitPromise = initializeRedis().catch(() => undefined);
	}

	await redisInitPromise;

	try {
		getRedisClient();
		return true;
	} catch {
		return false;
	}
};

const getClientIp = (context: Context): string => {
	const headers = context.req.raw.headers;
	const forwardedFor = headers.get('x-forwarded-for');
	if (forwardedFor) {
		return forwardedFor.split(',')[0]?.trim() || 'unknown';
	}

	return (
		headers.get('cf_clearance') ||
		headers.get('cf-connecting-ip') ||
		headers.get('x-real-ip') ||
		context.req.header('x-forwarded-for') ||
		'unknown'
	);
};

const sanitizePathForKey = (path: string): string => {
	return path
		.replace(/[^a-zA-Z0-9/_-]/g, '-')
		.replace(/\/+/g, '/')
		.slice(0, 120);
};

const resolvePolicy = (context: Context): RateLimitPolicy => {
	const path = context.req.path;
	const method = context.req.method;

	if (path.startsWith('/api/auth/')) {
		return {
			enabled: isAuthPolicyEnabled,
			max: parsedEnv.RATE_LIMIT_AUTH_MAX,
			windowSeconds: parsedEnv.RATE_LIMIT_AUTH_WINDOW_SECONDS,
			keyPrefix: 'auth',
		};
	}

	if (path.startsWith('/api/v1/trpc/')) {
		const trpcTier = method === 'POST' ? 'mutation' : 'query';
		return {
			enabled: true,
			max:
				trpcTier === 'mutation'
					? parsedEnv.RATE_LIMIT_TRPC_MUTATION_MAX
					: parsedEnv.RATE_LIMIT_TRPC_QUERY_MAX,
			windowSeconds:
				trpcTier === 'mutation'
					? parsedEnv.RATE_LIMIT_TRPC_MUTATION_WINDOW_SECONDS
					: parsedEnv.RATE_LIMIT_TRPC_QUERY_WINDOW_SECONDS,
			keyPrefix: `trpc:v1:${trpcTier}`,
		};
	}

	return {
		enabled: true,
		max: parsedEnv.RATE_LIMIT_GLOBAL_MAX,
		windowSeconds: parsedEnv.RATE_LIMIT_GLOBAL_WINDOW_SECONDS,
		keyPrefix: 'global',
	};
};

const consumeWithMemory = (
	key: string,
	policy: RateLimitPolicy
): RateLimitResult => {
	const now = Date.now();
	const windowMs = policy.windowSeconds * TimeMagic.MILLISECONDS_PER_SECOND;
	const current = localStore.get(key);

	if (!current || current.resetAt <= now) {
		localStore.set(key, { count: 1, resetAt: now + windowMs });
		return {
			allowed: true,
			limit: policy.max,
			remaining: Math.max(0, policy.max - 1),
			retryAfterSeconds: policy.windowSeconds,
		};
	}

	current.count += 1;
	localStore.set(key, current);

	const retryAfterSeconds = Math.max(
		1,
		Math.ceil((current.resetAt - now) / TimeMagic.MILLISECONDS_PER_SECOND)
	);
	const remaining = Math.max(0, policy.max - current.count);

	return {
		allowed: current.count <= policy.max,
		limit: policy.max,
		remaining,
		retryAfterSeconds,
	};
};

const consumeWithRedis = async (
	key: string,
	policy: RateLimitPolicy
): Promise<RateLimitResult> => {
	const client = getRedisClient();
	const count = await client.incr(key);

	if (count === 1) {
		await client.expire(key, policy.windowSeconds);
	}

	const ttl = await client.ttl(key);
	const retryAfterSeconds = ttl > 0 ? ttl : policy.windowSeconds;

	return {
		allowed: count <= policy.max,
		limit: policy.max,
		remaining: Math.max(0, policy.max - count),
		retryAfterSeconds,
	};
};

const setRateLimitHeaders = (
	context: Context,
	result: RateLimitResult
): void => {
	context.header('X-RateLimit-Limit', String(result.limit));
	context.header('X-RateLimit-Remaining', String(result.remaining));
	context.header('X-RateLimit-Reset', String(result.retryAfterSeconds));

	if (!result.allowed) {
		context.header('Retry-After', String(result.retryAfterSeconds));
	}
};

export const dynamicRateLimitMiddleware: MiddlewareHandler = async (
	context,
	next
) => {
	if (!parsedEnv.RATE_LIMIT_ENABLED) {
		await next();
		return;
	}

	const policy = resolvePolicy(context);

	if (!policy.enabled) {
		await next();
		return;
	}

	const ip = getClientIp(context);
	const key = [
		'rate-limit:v1',
		policy.keyPrefix,
		ip,
		sanitizePathForKey(context.req.path),
	].join(':');

	let result: RateLimitResult;
	const redisAvailable = await ensureRedisInitialized();

	if (redisAvailable) {
		try {
			result = await consumeWithRedis(key, policy);
		} catch {
			result = consumeWithMemory(key, policy);
		}
	} else {
		result = consumeWithMemory(key, policy);
	}

	setRateLimitHeaders(context, result);

	if (!result.allowed) {
		return context.json(
			{
				ok: false,
				code: 'TOO_MANY_REQUESTS',
				message: 'Rate limit exceeded',
				details: {
					retryAfterSeconds: result.retryAfterSeconds,
					remaining: result.remaining,
					limit: result.limit,
				},
			},
			statusCodes.TOO_MANY_REQUESTS
		);
	}

	return next();
};
