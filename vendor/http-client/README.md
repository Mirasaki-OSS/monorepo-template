# @md-oss/http-client

Opinionated fetch-based HTTP client with retries, timeouts, and typed responses.

## Features

- Base URL + path parameter resolution
- Query serialization (including arrays)
- Timeout and retry with exponential backoff + jitter
- Unified success/error result shape
- JSON, text, or raw response parsing modes

## Usage

```typescript
import { createHttpClient, isApiFailure } from '@md-oss/http-client';

const api = createHttpClient({
	serviceName: 'billing-api',
	baseUrl: 'https://api.example.com',
});

const result = await api.request<{ id: string; total: number }>(
	'/invoices/:id',
	{
		method: 'GET',
		pathParams: { id: 'inv_123' },
		timeoutMs: 5000,
		retries: 2,
	}
);

if (isApiFailure(result)) {
	console.error(result.message);
	return;
}

console.log(result.data.total);
```

### Utility

```typescript
import { jsonify } from '@md-oss/http-client';

const payload = jsonify({ createdAt: new Date() });
```
