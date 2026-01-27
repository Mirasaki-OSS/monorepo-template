# @md-oss/mutex

Mutex manager with automatic cleanup and TTL support for preventing race conditions in asynchronous operations.

## Features

- **Exclusive Execution** - Ensure only one operation runs at a time for a given key
- **Automatic Cleanup** - Mutexes are automatically removed after a configurable TTL
- **Flexible Keys** - Support for string keys or object-based keys with automatic normalization
- **Wait for Unlock** - Wait for a mutex to become available without acquiring it
- **Memory Efficient** - Unused mutexes are garbage collected based on TTL

## Installation

```bash
pnpm add @md-oss/mutex
```

## Usage

### Basic Usage

```typescript
import { MutexManager } from '@md-oss/mutex';

// Create a mutex manager with 60 second TTL
const mutexManager = new MutexManager(60000);

// Run exclusive operation with string key
await mutexManager.runExclusive('user-123', async () => {
  // This code will only run when no other operation with key 'user-123' is running
  await updateUserBalance(123);
});
```

### Preventing Race Conditions

```typescript
import { MutexManager } from '@md-oss/mutex';

const mutexManager = new MutexManager(30000);

// Without mutex - race condition possible
async function incrementCounter(userId: string) {
  const current = await getCounter(userId);
  await saveCounter(userId, current + 1);
}

// With mutex - safe from race conditions
async function incrementCounterSafe(userId: string) {
  await mutexManager.runExclusive(`counter-${userId}`, async () => {
    const current = await getCounter(userId);
    await saveCounter(userId, current + 1);
  });
}

// Multiple concurrent calls are now safe
await Promise.all([
  incrementCounterSafe('user-1'),
  incrementCounterSafe('user-1'),
  incrementCounterSafe('user-1')
]);
// Counter will be incremented exactly 3 times, no race condition
```

### Object-Based Keys

```typescript
// Use object keys for complex identifiers
await mutexManager.runExclusive(
  { userId: '123', action: 'update-profile' },
  async () => {
    await updateUserProfile(123, profileData);
  }
);

// Object keys are automatically normalized
// These are equivalent:
mutexManager.getMutex({ userId: '123', action: 'update' });
mutexManager.getMutex({ action: 'update', userId: '123' }); // Same mutex
```

### Manual Mutex Management

```typescript
// Get a mutex without running code
const mutex = mutexManager.getMutex('resource-key');

// Acquire and release manually
const release = await mutex.acquire();
try {
  // Do exclusive work
  await someOperation();
} finally {
  release();
}

// Check if locked
if (mutex.isLocked()) {
  console.log('Mutex is currently held');
}
```

### Wait for Unlock

```typescript
// Wait for a mutex to become available without acquiring it
await mutexManager.waitIfLocked('resource-key');
console.log('Mutex is now unlocked');

// Useful for waiting on operations without blocking
async function waitForUserUpdate(userId: string) {
  await mutexManager.waitIfLocked(`user-${userId}`);
  // User update is complete, safe to read
  return await getUser(userId);
}
```

## Use Cases

### 1. Database Updates

```typescript
const dbMutex = new MutexManager(10000);

async function updateUserBalance(userId: string, amount: number) {
  await dbMutex.runExclusive(`balance-${userId}`, async () => {
    const balance = await db.getBalance(userId);
    await db.setBalance(userId, balance + amount);
  });
}

// Safe concurrent balance updates
await Promise.all([
  updateUserBalance('123', 100),
  updateUserBalance('123', -50),
  updateUserBalance('123', 25)
]);
```

### 2. File Operations

```typescript
const fileMutex = new MutexManager(5000);

async function appendToFile(filename: string, content: string) {
  await fileMutex.runExclusive(filename, async () => {
    const existing = await fs.readFile(filename, 'utf-8');
    await fs.writeFile(filename, existing + content);
  });
}
```

### 3. Cache Refreshing

```typescript
const cacheMutex = new MutexManager(60000);

async function getCachedData(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  // Only one request refreshes the cache
  return await cacheMutex.runExclusive(`cache-${key}`, async () => {
    // Double-check inside mutex
    if (cache.has(key)) {
      return cache.get(key);
    }

    const data = await fetchExpensiveData(key);
    cache.set(key, data);
    return data;
  });
}
```

### 4. API Rate Limiting

```typescript
const apiMutex = new MutexManager(1000);

async function makeRateLimitedRequest(apiKey: string, request: any) {
  await apiMutex.runExclusive(apiKey, async () => {
    await fetch('https://api.example.com', {
      headers: { 'X-API-Key': apiKey },
      body: JSON.stringify(request)
    });
    // Wait 1 second before allowing next request
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
}
```

### 5. Resource Initialization

```typescript
const initMutex = new MutexManager(30000);
const resources = new Map<string, Resource>();

async function getOrCreateResource(id: string): Promise<Resource> {
  await initMutex.runExclusive(`resource-${id}`, async () => {
    if (!resources.has(id)) {
      const resource = await initializeResource(id);
      resources.set(id, resource);
    }
  });
  
  return resources.get(id)!;
}
```

## TTL and Cleanup

The mutex manager automatically cleans up unused mutexes after the configured TTL:

```typescript
// Create with 30 second TTL
const manager = new MutexManager(30000);

// Use a mutex
await manager.runExclusive('key-1', async () => {
  // Do work
});

// Timer resets on each use
await manager.runExclusive('key-1', async () => {
  // Do more work
});

// After 30 seconds of inactivity, 'key-1' mutex is cleaned up
// Memory is freed and a new mutex will be created on next use
```

### TTL Configuration Guidelines

```typescript
// Short-lived operations (API requests, quick DB queries)
const shortTTL = new MutexManager(5000); // 5 seconds

// Medium-lived operations (file processing, cache updates)
const mediumTTL = new MutexManager(30000); // 30 seconds

// Long-lived operations (background jobs, user sessions)
const longTTL = new MutexManager(300000); // 5 minutes
```

## Key Normalization

Object keys are automatically normalized for consistency:

```typescript
const manager = new MutexManager(10000);

// All of these use the same mutex
manager.getMutex({ userId: '123', type: 'update' });
manager.getMutex({ type: 'update', userId: '123' }); // Same
manager.getMutex({ userId: '123', type: 'update' }); // Same

// Normalized to: "mutex-type-update-userId-123"
```

## Error Handling

```typescript
const manager = new MutexManager(10000);

try {
  await manager.runExclusive('resource', async () => {
    throw new Error('Operation failed');
  });
} catch (error) {
  // Error is propagated, mutex is released
  console.error('Operation failed:', error);
}

// Mutex is automatically released even on error
```

## Performance Considerations

- **Mutex Creation**: O(1) - mutexes are created on-demand
- **Key Normalization**: O(n log n) for object keys, O(1) for strings
- **Memory**: Automatic cleanup prevents memory leaks
- **Concurrency**: Each key has its own mutex, allowing parallel operations on different keys

```typescript
// These can run in parallel (different keys)
await Promise.all([
  manager.runExclusive('user-1', async () => { /* ... */ }),
  manager.runExclusive('user-2', async () => { /* ... */ }),
  manager.runExclusive('user-3', async () => { /* ... */ })
]);

// These run sequentially (same key)
await Promise.all([
  manager.runExclusive('user-1', async () => { /* ... */ }),
  manager.runExclusive('user-1', async () => { /* ... */ }),
  manager.runExclusive('user-1', async () => { /* ... */ })
]);
```

## API Reference

### Constructor

```typescript
new MutexManager(ttl: number)
```

Create a new mutex manager with the specified TTL in milliseconds.

### Methods

#### `getMutex(key)`

```typescript
getMutex(key: string | Record<string, string>): Mutex
```

Get or create a mutex for the given key. Resets the cleanup timer.

#### `runExclusive(key, fn)`

```typescript
async runExclusive<T>(
  key: string | Record<string, string>,
  fn: () => Promise<T>
): Promise<T>
```

Acquire the mutex for the given key, execute the function exclusively, then release the mutex.

#### `waitIfLocked(key)`

```typescript
async waitIfLocked(key: string | Record<string, string>): Promise<void>
```

Wait for the mutex to become available without acquiring it. Returns immediately if the mutex is not locked.

## Best Practices

### 1. Choose Appropriate TTL

```typescript
// Match TTL to operation frequency
const frequentOps = new MutexManager(5000);   // Operations every few seconds
const infrequentOps = new MutexManager(60000); // Operations every few minutes
```

### 2. Use Descriptive Keys

```typescript
// Good - clear and specific
manager.runExclusive(`user-${userId}-balance`, async () => { /* ... */ });

// Bad - ambiguous
manager.runExclusive(userId, async () => { /* ... */ });
```

### 3. Keep Critical Sections Small

```typescript
// Good - minimal time in mutex
await manager.runExclusive('resource', async () => {
  await criticalOperation();
});
await nonCriticalOperation();

// Bad - unnecessary time in mutex
await manager.runExclusive('resource', async () => {
  await criticalOperation();
  await nonCriticalOperation(); // Doesn't need mutex
});
```

### 4. Handle Errors Properly

```typescript
await manager.runExclusive('key', async () => {
  try {
    await riskyOperation();
  } catch (error) {
    // Handle error inside mutex if needed
    await rollback();
    throw error; // Re-throw if appropriate
  }
});
```

## Underlying Library

This package is built on top of [async-mutex](https://github.com/DirtyHairy/async-mutex) and adds:
- Automatic cleanup with TTL
- Key normalization for objects
- Centralized mutex management
- Simplified API for common patterns
