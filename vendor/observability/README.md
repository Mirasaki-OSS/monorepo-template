# @md-oss/observability

Structured logging with Winston for production-ready observability.

## Features

- **Structured Logging** - JSON-formatted logs with Winston
- **Multiple Transports** - Console and file-based logging with automatic rotation
- **Exception Handling** - Automatic logging of unhandled exceptions and rejections
- **Child Loggers** - Create contextual loggers with custom metadata
- **Configurable Levels** - Support for all Winston log levels (error, warn, info, verbose, debug, silly)
- **Log Rotation** - Automatic file rotation with configurable size limits

## Installation

```bash
pnpm add @md-oss/observability
```

## Usage

### Basic Logging

```typescript
import { logger } from '@md-oss/observability';

// Log at different levels
logger.error('Critical error occurred', { userId: 123 });
logger.warn('Warning message', { action: 'deprecated' });
logger.info('User logged in', { userId: 456 });
logger.verbose('Detailed information');
logger.debug('Debug information');
logger.silly('Very detailed debug info');

// Log errors with stack traces
try {
  throw new Error('Something went wrong');
} catch (error) {
  logger.error('Operation failed', { error });
}
```

### Child Loggers

Create contextual loggers with custom metadata:

```typescript
import { createChildLogger } from '@md-oss/observability';

// Create a logger for a specific service
const userServiceLogger = createChildLogger({
  service: 'user-service',
  component: 'authentication'
});

userServiceLogger.info('User authenticated', { userId: 123 });
// Logs: { service: 'user-service', component: 'authentication', message: 'User authenticated', userId: 123 }

// Create a logger for a specific request
const requestLogger = createChildLogger({
  requestId: 'req-abc-123',
  userId: 456
});

requestLogger.info('Processing request');
requestLogger.error('Request failed');
// All logs include requestId and userId
```

## Configuration

Set environment variables to configure logging behavior:

### Environment Variables

```bash
# Required
NODE_ENV=development          # or 'production', 'test'

# Optional
LOG_LEVEL=info               # error | warn | info | verbose | debug | silly
LOG_DIR=./logs               # Directory for log files (relative to cwd)
LOG_TO_CONSOLE=true          # Enable/disable console logging
```

### Log Files

When `LOG_DIR` is set, the following files are created:

- **`combined.log`** - All logs (max 10MB per file, keeps last 7 files)
- **`errors.log`** - Error level logs only (max 10MB per file, keeps last 3 files)
- **`exceptions.log`** - Unhandled exceptions
- **`rejections.log`** - Unhandled promise rejections

### Example Configuration

```env
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
LOG_TO_CONSOLE=true
LOG_DIR=./logs

# .env.production
NODE_ENV=production
LOG_LEVEL=info
LOG_TO_CONSOLE=false
LOG_DIR=/var/log/app
```

## Log Format

### Console Output (Development)

```
2026-01-27 10:30:45 info: User logged in userId=123
2026-01-27 10:30:46 error: Operation failed error=[Error: Something went wrong]
```

### File Output (JSON)

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2026-01-27 10:30:45",
  "service": "my-app",
  "version": "1.0.0",
  "userId": 123
}
```

## Advanced Usage

### Custom Transports

Access the transports array to add custom Winston transports:

```typescript
import { transports, logger } from '@md-oss/observability';
import winston from 'winston';

// Add a custom transport
transports.push(
  new winston.transports.Http({
    host: 'log-server.example.com',
    port: 8080
  })
);
```

### Log Level Access

```typescript
import { logLevel } from '@md-oss/observability';

console.log('Current log level:', logLevel); // 'info'

// Conditionally log based on level
if (logLevel === 'debug' || logLevel === 'silly') {
  logger.debug('Detailed debug information');
}
```

### Metadata and Formatting

```typescript
import { logger } from '@md-oss/observability';

// Log with structured metadata
logger.info('User action', {
  action: 'login',
  userId: 123,
  ip: '192.168.1.1',
  timestamp: Date.now()
});

// String interpolation with metadata
logger.info('User %s performed %s', 'John', 'login', {
  userId: 123
});
```

## Exception Handling

Unhandled exceptions and promise rejections are automatically logged:

```typescript
// Unhandled exception - automatically logged to exceptions.log
throw new Error('Unhandled error');

// Unhandled promise rejection - automatically logged to rejections.log
Promise.reject(new Error('Unhandled promise rejection'));
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Production errors
logger.error('Payment processing failed', { orderId: 123, error });

// Important events
logger.warn('API rate limit approaching', { usage: 0.9 });

// Business logic events
logger.info('Order created', { orderId: 456, total: 99.99 });

// Detailed flow information (development)
logger.debug('Cache hit', { key: 'user:123', ttl: 300 });

// Very detailed debugging (development only)
logger.silly('Raw request data', { headers, body });
```

### 2. Include Context in Logs

```typescript
// Good - includes context
logger.error('Database query failed', {
  query: 'SELECT * FROM users',
  error,
  duration: 1500
});

// Bad - lacks context
logger.error('Query failed');
```

### 3. Use Child Loggers for Modules

```typescript
// api/users.ts
const userLogger = createChildLogger({ module: 'users' });

export function getUser(id: number) {
  userLogger.info('Fetching user', { userId: id });
  // ...
}

// api/orders.ts
const orderLogger = createChildLogger({ module: 'orders' });

export function createOrder(data: Order) {
  orderLogger.info('Creating order', { order: data });
  // ...
}
```

### 4. Structured Logging

```typescript
// Good - structured and searchable
logger.info('User login', {
  event: 'user.login',
  userId: 123,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

// Bad - unstructured string
logger.info(`User ${userId} logged in from ${ip}`);
```

## Performance Considerations

- **File I/O**: File transports use buffered writes (minimal overhead)
- **Log Rotation**: Automatic rotation prevents disk space issues
- **Conditional Logging**: Check log level before expensive operations

```typescript
// Avoid expensive serialization if not needed
if (logLevel === 'debug') {
  logger.debug('Complex object', JSON.stringify(largeObject, null, 2));
}
```

## Types

```typescript
import type { winston } from '@md-oss/observability';

// winston is re-exported from the winston package
const logger: winston.Logger = createChildLogger({ service: 'my-service' });
```

## API Reference

### Logger

- `logger.error(message, metadata?)` - Log error level
- `logger.warn(message, metadata?)` - Log warning level
- `logger.info(message, metadata?)` - Log info level
- `logger.verbose(message, metadata?)` - Log verbose level
- `logger.debug(message, metadata?)` - Log debug level
- `logger.silly(message, metadata?)` - Log silly level

### Functions

- `createChildLogger(metadata)` - Create a contextual logger with default metadata

### Exports

- `logger: winston.Logger` - Main logger instance
- `logLevel: string` - Current log level
- `transports: winston.transport[]` - Array of active transports
- `winston: typeof winston` - Winston type exports
