import { stableSerializeForCacheKey } from '@md-oss/serdes';

type CacheKeyResolver<Args extends unknown[]> = (...args: Args) => string;

type SlidingAsyncCacheOptions<Args extends unknown[]> = {
	ttlMs: number;
	keyResolver?: CacheKeyResolver<Args>;
	maxEntries?: number;
};

type CacheEntry<Value> = {
	value: Value;
	expiresAt: number;
};

const defaultKeyResolver = (...args: unknown[]) =>
	stableSerializeForCacheKey(args);

export const createSlidingAsyncCache = <Args extends unknown[], Value>(
	loader: (...args: Args) => Promise<Value>,
	{ ttlMs, keyResolver, maxEntries = 500 }: SlidingAsyncCacheOptions<Args>
) => {
	const cache = new Map<string, CacheEntry<Value>>();
	const inFlight = new Map<string, Promise<Value>>();
	const getKey = (keyResolver ?? defaultKeyResolver) as CacheKeyResolver<Args>;

	const pruneExpired = (now: number) => {
		for (const [key, entry] of cache) {
			if (entry.expiresAt <= now) {
				cache.delete(key);
			}
		}
	};

	const pruneOverflow = () => {
		if (cache.size <= maxEntries) {
			return;
		}

		const entries = [...cache.entries()].sort(
			(a, b) => a[1].expiresAt - b[1].expiresAt
		);
		const excessCount = cache.size - maxEntries;

		for (const [key] of entries.slice(0, excessCount)) {
			cache.delete(key);
		}
	};

	const getOrLoad = async (...args: Args): Promise<Value> => {
		const key = getKey(...args);
		const now = Date.now();
		const entry = cache.get(key);

		if (entry && entry.expiresAt > now) {
			entry.expiresAt = now + ttlMs;
			return entry.value;
		}

		const pending = inFlight.get(key);
		if (pending) {
			return pending;
		}

		const loadPromise = loader(...args)
			.then((value) => {
				cache.set(key, {
					value,
					expiresAt: Date.now() + ttlMs,
				});

				pruneExpired(Date.now());
				pruneOverflow();

				return value;
			})
			.finally(() => {
				inFlight.delete(key);
			});

		inFlight.set(key, loadPromise);

		return loadPromise;
	};

	return {
		getOrLoad,
		invalidate: (...args: Args) => {
			cache.delete(getKey(...args));
		},
		clear: () => {
			cache.clear();
			inFlight.clear();
		},
		size: () => cache.size,
	};
};
