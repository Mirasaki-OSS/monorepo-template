import type { PromiseLoader } from './types';

type KeyedCacheEntry<T> = {
	expiresAt: number;
	inFlight?: Promise<T>;
	value?: T;
};

declare global {
	var __MdOSSKeyedPromiseCaches:
		| Map<string, Map<string, KeyedCacheEntry<unknown>>>
		| undefined;
}

const getGlobalKeyedCacheRegistry = () => {
	const existing = globalThis.__MdOSSKeyedPromiseCaches;
	if (existing) {
		return existing;
	}

	const registry = new Map<string, Map<string, KeyedCacheEntry<unknown>>>();
	globalThis.__MdOSSKeyedPromiseCaches = registry;
	return registry;
};

const getOrCreateNamespaceKeyedCache = (
	namespace: string
): Map<string, KeyedCacheEntry<unknown>> => {
	const registry = getGlobalKeyedCacheRegistry();
	const existing = registry.get(namespace);

	if (existing) {
		return existing;
	}

	const cache = new Map<string, KeyedCacheEntry<unknown>>();
	registry.set(namespace, cache);
	return cache;
};

const createKeyedPromiseCache = (namespace: string) => {
	const cache = getOrCreateNamespaceKeyedCache(namespace);

	const getOrLoad = <T>(
		cacheKey: string,
		ttlMs: number,
		loader: PromiseLoader<T>
	): Promise<T> => {
		const now = Date.now();
		const existing = cache.get(cacheKey) as KeyedCacheEntry<T> | undefined;

		if (existing?.value !== undefined && existing.expiresAt > now) {
			return Promise.resolve(existing.value);
		}

		if (existing?.inFlight) {
			return existing.inFlight;
		}

		const inFlight = loader()
			.then((value) => {
				cache.set(cacheKey, {
					expiresAt: Date.now() + ttlMs,
					value,
				});
				return value;
			})
			.catch((error) => {
				const latest = cache.get(cacheKey) as KeyedCacheEntry<T> | undefined;
				if (latest?.inFlight === inFlight) {
					cache.delete(cacheKey);
				}
				throw error;
			});

		cache.set(cacheKey, {
			expiresAt: existing?.expiresAt ?? 0,
			inFlight,
			value: existing?.value,
		});

		return inFlight;
	};

	const invalidate = (cacheKeyPrefix?: string): void => {
		if (!cacheKeyPrefix) {
			cache.clear();
			return;
		}

		for (const key of cache.keys()) {
			if (key.startsWith(cacheKeyPrefix)) {
				cache.delete(key);
			}
		}
	};

	return {
		getOrLoad,
		invalidate,
	};
};

export { createKeyedPromiseCache };
