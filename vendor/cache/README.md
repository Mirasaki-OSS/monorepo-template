# @md-oss/cache

Multi-layer caching with LRU, Redis, and async data fetching support built on cache-manager and Keyv.

## Features

- **Multi-Store Support** - Use LRU cache, Redis, or combine multiple stores
- **Async Cache Manager** - Automatic data fetching with cache-aside pattern
- **Promise Caching** - Cache in-flight promises to prevent duplicate requests
- **Metadata Tracking** - Built-in statistics for hits, misses, and performance
- **TTL Support** - Configurable time-to-live for all cache entries
- **Event System** - Listen to cache operations (set, delete, clear, refresh)
- **Type-Safe** - Full TypeScript support with generics

## Installation

```bash
pnpm add @md-oss/cache
```

## Basic Usage

### LRU Cache Manager

```typescript
import { CacheManager, LRUCache } from '@md-oss/cache';
import Keyv from 'keyv';

// Create an in-memory LRU cache
const cache = CacheManager.fromStore<string>(
  new LRUCache({
    max: 1000, // Maximum 1000 items
    ttl: 60000 // 60 seconds TTL
  })
);

// Set a value
await cache.set('user:123', 'John Doe', 30000); // 30 second TTL

// Get a value
const user = await cache.get('user:123'); // 'John Doe'

// Delete a value
await cache.del('user:123');

// Clear all
await cache.clear();
```

### Async Cache Manager

Automatically fetch and cache data when not found:

```typescript
import { AsyncCacheManager } from '@md-oss/cache';
import Keyv from 'keyv';

const userCache = new AsyncCacheManager({
  stores: [new Keyv()],
  ttl: 60000, // 60 seconds
  dataFunction: async (userId: string) => {
    // This function runs only on cache miss
    const user = await db.users.findOne({ id: userId });
    return user;
  }
});

// First call - fetches from database and caches
const user1 = await userCache.get('user:123');

// Second call - returns from cache
const user2 = await userCache.get('user:123');

console.log(userCache.metadata);
// { hits: 1, misses: 1, added: 1, deleted: 0, ... }
```

### Promise Cache

Prevent duplicate in-flight requests:

```typescript
import { PromiseCache } from '@md-oss/cache';

const apiCache = new PromiseCache<User>(5000); // 5 second cache

async function getUser(id: string) {
  return apiCache.get(async () => {
    // This function won't run if a request is already in-flight
    return await fetch(`/api/users/${id}`).then(r => r.json());
  });
}

// These 3 calls will only make 1 API request
const [user1, user2, user3] = await Promise.all([
  getUser('123'),
  getUser('123'),
  getUser('123')
]);
```

## Redis Cache

### Setup

Set the Redis URL in your environment:

```env
REDIS_URL=redis://localhost:6379
```

### Usage

```typescript
import { initializeRedis, getRedisClient } from '@md-oss/cache';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

// Initialize Redis connection
await initializeRedis();

// Get Redis client
const redisClient = getRedisClient();

// Use Redis as cache store
const cache = CacheManager.fromStore<User>(
  new Keyv({
    store: new KeyvRedis(redisClient)
  })
);

await cache.set('user:123', userData);
```

## Advanced Usage

### Multi-Store Caching

Layer multiple caches for optimal performance:

```typescript
import { CacheManager, LRUCache } from '@md-oss/cache';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

// Create a multi-layer cache: LRU (L1) → Redis (L2)
const cache = new CacheManager<User>({
  stores: [
    // L1: Fast in-memory cache
    new Keyv({
      store: new LRUCache({ max: 500, ttl: 60000 })
    }),
    // L2: Shared Redis cache
    new Keyv({
      store: new KeyvRedis(redisClient)
    })
  ],
  ttl: 300000 // 5 minutes default TTL
});

// Get checks L1 first, then L2, populates higher levels on hit
const user = await cache.get('user:123');
```

### Async Cache with Callbacks

Track cache performance and errors:

```typescript
import { AsyncCacheManager } from '@md-oss/cache';

const cache = new AsyncCacheManager({
  stores: [new Keyv()],
  ttl: 60000,
  dataFunction: async (key: string) => {
    const data = await fetchExpensiveData(key);
    return data;
  },
  callbacks: {
    onStart: (key) => {
      console.log(`Fetching data for ${key}`);
    },
    onEnd: (key, duration) => {
      console.log(`Fetch took ${duration}ms for ${key}`);
    },
    onSuccess: (key, value) => {
      console.log(`Successfully cached ${key}`);
    },
    onError: (key, error) => {
      console.error(`Error fetching ${key}:`, error);
    }
  }
});

// Check async metadata
console.log(cache.metadata.async);
// { last: 123, total: 456, average: 152, longest: 234, shortest: 89 }
```

### Cache Events

Listen to cache operations:

```typescript
import { CacheManager } from '@md-oss/cache';

const cache = CacheManager.fromStore<string>(new LRUCache({ max: 100 }));

cache.on('set', ({ key, value, error }) => {
  if (!error) {
    console.log(`Cached: ${key} = ${value}`);
  }
});

cache.on('del', ({ key, error }) => {
  if (!error) {
    console.log(`Deleted: ${key}`);
  }
});

cache.on('clear', () => {
  console.log('Cache cleared');
});

cache.on('refresh', ({ key, error }) => {
  if (!error) {
    console.log(`Refreshed: ${key}`);
  }
});
```

### Batch Operations

```typescript
// Get multiple keys
const users = await cache.mget(['user:1', 'user:2', 'user:3']);

// Set multiple keys
await cache.mset([
  { key: 'user:1', value: user1, ttl: 60000 },
  { key: 'user:2', value: user2, ttl: 60000 },
  { key: 'user:3', value: user3, ttl: 60000 }
]);

// Delete multiple keys
await cache.mdel(['user:1', 'user:2', 'user:3']);
```

### Cache Wrapping

Wrap expensive operations with automatic caching:

```typescript
const result = await cache.wrap(
  'expensive-computation',
  async () => {
    // Only runs on cache miss
    return await performExpensiveComputation();
  },
  60000 // TTL in milliseconds
);
```

## Use Cases

### 1. API Response Caching

```typescript
import { AsyncCacheManager } from '@md-oss/cache';

const apiCache = new AsyncCacheManager<ApiResponse>({
  stores: [new Keyv()],
  ttl: 300000, // 5 minutes
  dataFunction: async (endpoint: string) => {
    const response = await fetch(endpoint);
    return response.json();
  }
});

app.get('/api/proxy/:path', async (req, res) => {
  const data = await apiCache.get(req.params.path);
  res.json(data);
});
```

### 2. Database Query Caching

```typescript
const userCache = new AsyncCacheManager<User>({
  stores: [
    new Keyv({ store: new LRUCache({ max: 1000, ttl: 60000 }) }),
    new Keyv({ store: new KeyvRedis(redisClient) })
  ],
  ttl: 600000, // 10 minutes
  dataFunction: async (userId: string) => {
    return await db.users.findUnique({ where: { id: userId } });
  }
});

async function getUser(id: string) {
  return userCache.get(id);
}
```

### 3. Session Management

```typescript
const sessionCache = CacheManager.fromStore<Session>(
  new Keyv({ store: new KeyvRedis(redisClient) })
);

async function getSession(sessionId: string) {
  return sessionCache.get(`session:${sessionId}`);
}

async function createSession(sessionId: string, data: Session) {
  await sessionCache.set(`session:${sessionId}`, data, 3600000); // 1 hour
}
```

### 4. Rate Limiting

```typescript
const rateLimitCache = CacheManager.fromStore<number>(
  new LRUCache({ max: 10000, ttl: 60000 })
);

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `rate:${userId}`;
  const count = (await rateLimitCache.get(key)) ?? 0;
  
  if (count >= 100) {
    return false; // Rate limit exceeded
  }
  
  await rateLimitCache.set(key, count + 1);
  return true;
}
```

### 5. Computed Value Caching

```typescript
const computeCache = new AsyncCacheManager<number>({
  stores: [new Keyv()],
  ttl: 3600000, // 1 hour
  dataFunction: async (key: string) => {
    const [start, end] = key.split(':');
    return await calculateComplexMetrics(Number(start), Number(end));
  }
});

async function getMetrics(startDate: Date, endDate: Date) {
  const key = `${startDate.getTime()}:${endDate.getTime()}`;
  return computeCache.get(key);
}
```

## Cache Metadata

Track cache performance:

```typescript
const cache = new AsyncCacheManager({ /* ... */ });

// Basic metadata
console.log(cache.metadata);
// {
//   hits: 150,
//   misses: 50,
//   added: 50,
//   deleted: 10,
//   updated: 20,
//   cleared: 0,
//   errors: 0,
//   async: {
//     last: 123,
//     total: 6150,
//     average: 123,
//     longest: 456,
//     shortest: 45
//   }
// }

// Calculate hit rate
const hitRate = cache.metadata.hits / (cache.metadata.hits + cache.metadata.misses);
console.log(`Cache hit rate: ${(hitRate * 100).toFixed(2)}%`);
```

## Performance Considerations

- **LRU Cache**: O(1) operations, best for hot data
- **Redis**: Network overhead, best for shared/persistent cache
- **Multi-Store**: Checks stores in order, populates higher levels on hit
- **Promise Cache**: Prevents thundering herd for in-flight requests

### Best Practices

```typescript
// Use appropriate TTLs
const shortTTL = 60000;     // 1 minute for volatile data
const mediumTTL = 600000;   // 10 minutes for regular data
const longTTL = 3600000;    // 1 hour for stable data

// Layer caches appropriately
const cache = new CacheManager({
  stores: [
    new Keyv({ store: new LRUCache({ max: 100, ttl: shortTTL }) }),  // Hot cache
    new Keyv({ store: new KeyvRedis(redis), ttl: longTTL })         // Warm cache
  ]
});

// Use promise caching for expensive operations
const promiseCache = new PromiseCache(5000);
const result = await promiseCache.get(() => expensiveOperation());
```

## API Reference

### CacheManager

- `get(key)` - Get a value from cache
- `mget(keys)` - Get multiple values
- `set(key, value, ttl?)` - Set a value
- `mset(entries)` - Set multiple values
- `del(key)` - Delete a value
- `mdel(keys)` - Delete multiple values
- `clear()` - Clear all cache entries
- `wrap(key, fn, ttl?)` - Wrap function with caching
- `ttl(key)` - Get remaining TTL for a key
- `keys()` - Get all cached keys
- `on(event, listener)` - Listen to cache events
- `extend(options)` - Create extended cache manager
- `disconnect()` - Disconnect all stores

### AsyncCacheManager

Extends `CacheManager` with:
- `dataFunction` - Automatic data fetching on cache miss
- `callbacks` - Lifecycle callbacks (onStart, onEnd, onSuccess, onError)
- Additional metadata tracking for async operations

### PromiseCache

- `get(generator)` - Get or generate cached promise
- `clear()` - Clear cached promise

### Redis

- `initializeRedis()` - Initialize Redis connection
- `getRedisClient()` - Get Redis client instance
- `redisSetKv(key, value, ttl)` - Set key-value with TTL

## Types

```typescript
import type {
  AbstractCache,
  CacheManagerMetadata,
  AsyncCacheManagerMetadata,
  WithCacheDetails,
  SetCacheArguments,
  LRUArgs
} from '@md-oss/cache';
```

## Environment Variables

```env
REDIS_URL=redis://localhost:6379  # Required for Redis support
```
