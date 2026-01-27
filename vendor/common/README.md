# @md-oss/common

Constants, magic numbers, and utilities used commonly across projects.

## Table of Contents

- [Constants](#constants)
- [Utilities](#utilities)
- [API](#api)
- [Schemas](#schemas)

## Constants

### Byte Sizes
```typescript
import { ByteMagic } from '@md-oss/common';

console.log(ByteMagic.MEGABYTE); // 1048576
console.log(ByteMagic.GIGABYTE); // 1073741824
```

### Discord Limits
```typescript
import { DiscordMagic } from '@md-oss/common';

console.log(DiscordMagic.MESSAGE_CONTENT_MAX); // 2000
console.log(DiscordMagic.EMBED_DESCRIPTION_MAX); // 4096
console.log(DiscordMagic.FILE_SIZE_MAX); // 8388608 (8MB)
```

### Time Conversions
```typescript
import { TimeMagic } from '@md-oss/common';

console.log(TimeMagic.SECOND); // 1000ms
console.log(TimeMagic.MINUTES_PER_HOUR); // 60
console.log(TimeMagic.MILLISECONDS_PER_DAY); // 86400000
```

## Utilities

### Array Utilities
```typescript
import { ArrayUtils } from '@md-oss/common';

// Chunk an array
ArrayUtils.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Join with max items
ArrayUtils.join(['a', 'b', 'c', 'd'], { maxItems: 2 });
// "a, b, and 2 more..."

// Type guards
ArrayUtils.isStringArray(['a', 'b']); // true
ArrayUtils.isNumberArray([1, 2, 3]); // true
```

### String Utilities
```typescript
import { StringUtils } from '@md-oss/common';

// Case conversions
StringUtils.camelCase('hello world'); // 'helloWorld'
StringUtils.kebabCase('HelloWorld'); // 'hello-world'
StringUtils.snakeCase('HelloWorld'); // 'hello_world'
StringUtils.titleCase('hello world'); // 'Hello World'
StringUtils.pascalCase('hello world'); // 'HelloWorld'

// String manipulation
StringUtils.truncate('hello world', 8); // 'hello...'
StringUtils.pluralize('item', 2); // 'items'
StringUtils.replaceTags('Hello {name}', { name: 'John' }); // 'Hello John'
StringUtils.isUrl('https://example.com'); // true
```

### Number Utilities
```typescript
import { NumberUtils } from '@md-oss/common';

// Type checks
NumberUtils.isInt(42); // true
NumberUtils.isFloat(42.5); // true

// Statistics
NumberUtils.calculateMean([1, 2, 3, 4]); // 2.5
NumberUtils.calculateMedian([1, 2, 3, 4, 5]); // 3
NumberUtils.calculateVariance([1, 2, 3, 4]); // 1.25
NumberUtils.calculateStandardDeviation([1, 2, 3, 4]); // ~1.118

// Constants
NumberUtils.INT32_MAX; // 2147483647
NumberUtils.INT64_MAX; // 9223372036854775807n
```

### Object Utilities
```typescript
import { ObjectUtils } from '@md-oss/common';

// Type guards
ObjectUtils.isObject({ a: 1 }); // true
ObjectUtils.isEmptyObject({}); // true

// Deep operations
const cloned = ObjectUtils.deepClone({ a: { b: 1 } });
const merged = ObjectUtils.deepMerge({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }

// Nested value access
ObjectUtils.getNestedValue({ a: { b: { c: 1 } } }, 'a.b.c'); // 1
ObjectUtils.getNestedValue({ user: { name: 'John' } }, 'user.name'); // 'John'
```

### Random Utilities
```typescript
import { RandomUtils } from '@md-oss/common';

// Random numbers
RandomUtils.randomInt(1, 10); // random int between 1-10
RandomUtils.randomFloat(0, 1); // random float between 0-1
RandomUtils.randomBoolean(); // true or false

// Random selections
RandomUtils.randomItem([1, 2, 3, 4, 5]); // random item
RandomUtils.randomKey({ a: 1, b: 2 }); // 'a' or 'b'
RandomUtils.randomValue({ a: 1, b: 2 }); // 1 or 2

// Random strings
RandomUtils.randomString(8, { useUppercase: true, useNumeric: true });
// e.g., 'A3bF9xK1'
```

### Time Utilities
```typescript
import { TimeUtils } from '@md-oss/common';

// Unix timestamps
TimeUtils.unix(Date.now()); // current unix timestamp
TimeUtils.unixNow(); // shorthand for unix(Date.now())

// Human-readable durations
TimeUtils.humanReadableMs(5000); // '5 seconds'
TimeUtils.humanReadableMs(125000, 3); // '2 minutes and 5 seconds'

// Async utilities
await TimeUtils.sleep(1000); // sleep for 1 second

// Performance tracking
TimeUtils.hrTimeToMs([0, 123456789]); // convert hrtime to milliseconds
TimeUtils.bigIntDurationToHumanReadable(startTime); // format duration
```

### Runtime Utilities
```typescript
import { RuntimeUtils } from '@md-oss/common';

// Sleep utilities
await RuntimeUtils.sleep(1000); // sleep for 1 second
await RuntimeUtils.sleepUntil(() => someCondition);
await RuntimeUtils.sleepUntilOrTimeout(() => someCondition, 5000);

// Await with timeout
const result = await RuntimeUtils.awaitOrTimeout(promise, 5000);

// Safe timeout/interval (handles values > INT32_MAX)
RuntimeUtils.safeSetTimeout(86400000, false, () => {
  console.log('runs after 24 hours');
});

RuntimeUtils.safeSetInterval(1000, () => {
  console.log('runs every second');
});

RuntimeUtils.safeSetAsyncInterval(1000, async () => {
  await doAsyncWork();
});
```

### MIME Type Utilities
```typescript
import { MimeTypeUtils } from '@md-oss/common';

// Validation
MimeTypeUtils.isAllowedMimeType('image/png', 'IMAGE'); // true
MimeTypeUtils.isAllowedMimeType('application/pdf', 'SAFE'); // true

// HTML input accept strings
MimeTypeUtils.getInputAccept('IMAGE'); 
// 'image/png,image/jpeg,image/webp,...'

// Type resolution
MimeTypeUtils.mimeTypeResolver('video/mp4'); // 'VIDEO'
MimeTypeUtils.mimeTypeResolver('application/pdf'); // 'DOCUMENT'

// Content disposition
MimeTypeUtils.isInlineContentDisposition('image/png'); // true
MimeTypeUtils.isInlineContentDisposition('application/zip'); // false
```

## API

### Status Codes
```typescript
import { statusCodes, type StatusCode } from '@md-oss/common';

// Use named status codes
statusCodes.OK; // 200
statusCodes.CREATED; // 201
statusCodes.BAD_REQUEST; // 400
statusCodes.UNAUTHORIZED; // 401
statusCodes.NOT_FOUND; // 404
statusCodes.INTERNAL_SERVER_ERROR; // 500
```

### API Errors
```typescript
import { APIError, isAPIError, parseError } from '@md-oss/common';

// Create API errors
const error = new APIError(404, {
  code: 'NOT_FOUND',
  message: 'Resource not found',
  details: { id: '123' }
});

// Alternative constructor syntax
const error2 = new APIError({
  status: 400,
  code: 'VALIDATION_ERROR',
  message: 'Invalid input',
  headers: { 'X-Custom': 'value' }
});

// Type guards
if (isAPIError(error)) {
  console.log(error.statusCode, error.body.code);
}

// Parse unknown errors into APIError
try {
  await someOperation();
} catch (err) {
  const apiError = parseError(err, 'OPERATION_FAILED', 'Operation failed');
  throw apiError;
}

// Serialize to JSON
const json = error.toJSON();
```

### Request/Response Types
```typescript
import type { 
  MinimalRequest, 
  MinimalResponse, 
  MinimalNextFunction,
  MinimalRequestHandler 
} from '@md-oss/common';

// Framework-agnostic request handler types
const handler: MinimalRequestHandler = async (req, res, next) => {
  const userIp = req.ip;
  const params = req.params;
  const query = req.query;
  
  res.status(200).json({ success: true });
};
```

## Schemas

### Zod Utilities
```typescript
import { 
  isFieldRequired, 
  requiredKeys, 
  zodEnumFromObjectKeys,
  paginationQuerySchema 
} from '@md-oss/common';
import { z } from 'zod';

// Check if a field is required
const schema = z.object({
  name: z.string(),
  age: z.number().optional(),
});
isFieldRequired(schema, 'name'); // true
isFieldRequired(schema, 'age'); // false

// Get all required keys
const required = requiredKeys(schema);
// ['name']

// Create enum from object keys
const roles = { ADMIN: 1, USER: 2, GUEST: 3 };
const roleEnum = zodEnumFromObjectKeys(roles);
// z.enum(['ADMIN', 'USER', 'GUEST'])

// Pagination schema
const paginationSchema = paginationQuerySchema({
  min: 1,
  max: 100,
  defaultLimit: 25
});

// Parse pagination query
const { limit, offset } = paginationSchema.parse({
  limit: '50',
  offset: '0'
});
```

### Signed URL Schema
```typescript
import { signedUrlSchema, type SignedUrlSchema } from '@md-oss/common';

// Validate signed URL parameters
const params = signedUrlSchema.parse({
  expires: 1640995200,
  sig: 'abc123',
  ref: 'user-123'
});
```

### Pagination Type
```typescript
import type { Pagination } from '@md-oss/common';

const pagination: Pagination = {
  totalItems: 100,
  currentPage: 1,
  itemsPerPage: 25,
  totalPages: 4,
  limit: 25,
  offset: 0
};
```
