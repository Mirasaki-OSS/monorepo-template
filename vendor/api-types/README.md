# @md-oss/api-types

Type-safe API contracts and helpers for building clients and route handlers around shared `@md-oss/common` errors and Zod-validated inputs/outputs.

## Features
- Route registries with Zod schemas for params, query, body, and optional response validation
- Typed API client factory (`createApiClient`) that strips unsafe headers and returns full HTTP response metadata (`statusCode`, `headers`, raw `Response`, etc.)
- Generic controller/route handler builders (`createGenericController`, `createGenericRouteHandler`) with pluggable auth/context/permission strategies
- Response helpers (`sendTypedResponse`) and request parsers (`parseRequestParameters`) that serialize consistently with the common API shape
- Utilities for prefixing routes, parsing/stripping proxy headers, and fine-grained debug namespaces (`md-oss:api-types:*`)

## Installation

```bash
pnpm add @md-oss/api-types
```

## Define a typed route registry

```typescript
import { z } from 'zod';
import type { RouteRegistry } from '@md-oss/api-types';

const routes = {
	'/users/:id': {
		params: z.object({ id: z.string() }),
		endpoints: {
			GET: {
				response: { id: '123', email: 'user@example.com' },
				permissions: null,
			},
		},
	},
	'/posts': {
		endpoints: {
			POST: {
				body: z.object({ title: z.string(), body: z.string() }),
				response: { id: 'post-id' },
				permissions: { role: 'editor' },
			},
		},
	},
} satisfies RouteRegistry;
```

## Create a typed client

```typescript
import { createApiClient } from '@md-oss/api-types';

const client = createApiClient(routes, {
	baseUrl: 'https://api.example.com',
});

const result = await client.request('/users/:id', {
	method: 'GET',
	params: { id: '123' },
});

if (!result.ok) {
	// HTTP error response with metadata
}

const user = result.data;
```

## Opt-in response validation with Zod

When an endpoint declares `response` as a Zod schema, response typing and runtime validation are both enabled automatically.

You can also declare `responses` as a status-code map of schemas.

`response` and `responses` are mutually exclusive. Use exactly one.

```typescript
import { z } from 'zod';
import type { RouteRegistry } from '@md-oss/api-types';

const routes = {
	'/users/:id': {
		params: z.object({ id: z.string() }),
		endpoints: {
			GET: {
				response: z.object({ id: z.string(), email: z.email() }),
				permissions: null,
			},
		},
	},
} satisfies RouteRegistry;
```

- Server: `sendTypedResponse` validates the outgoing body when a response schema is present.
- Client: `createApiClient(...).request(...)` validates successful responses when a response schema is present.
- Non-Zod `response` values continue to work as before (type-only behavior, no runtime validation).

### Status-code response schemas (`responses`)

```typescript
const routes = {
	'/users/:id': {
		params: z.object({ id: z.string() }),
		endpoints: {
			GET: {
				responses: {
					200: z.object({ id: z.string(), email: z.email() }),
					304: z.null(),
					default: apiErrorResponseSchema // <- Used if status code not included in mapping
				},
				permissions: null,
			},
		},
	},
} satisfies RouteRegistry;
```

- `responses[statusCode]` is used for runtime validation when present.
- If `responses` is used and a status code has no schema, no runtime response validation is applied for that status.

## Build controllers with typed context

```typescript
import {
	createGenericController,
	sendTypedResponse,
	type ContextProvider,
} from '@md-oss/api-types';

const authStrategy = {
	async resolveAuthentication(req, res, endpoint) {
		// return { session: { userId: 'u1' } } or { session: null }
		return { session: null };
	},
};

const contextStrategy = {
	async buildContext(session, endpoint, parsed, injected, req, res, requestId) {
		return {
			...parsed,
			session,
			endpoint,
			ctx: { requestId },
			cps: async () => true,
		} satisfies ContextProvider<typeof routes, any, '/users/:id', 'GET', null>;
	},
};

const getUser = createGenericController(
	routes,
	'/users/:id',
	'GET',
	authStrategy,
	contextStrategy
)((context, respond) => {
	respond({
		path: '/users/:id',
		method: 'GET',
		data: { id: context.params.id, email: 'user@example.com' },
	});
});

// use getUser as an Express/Next/fastify style handler
```

`createGenericRouteHandler` powers `.withContext(...)` so you can inject pre-built context when wiring routes.

## Validate requests and respond consistently

- `parseRequestParameters` validates params/query/body against Zod schemas and builds a typed context payload.
- `sendTypedResponse` returns JSON with `{ ok, code, message, data }` by default, or flattens the payload when `flattenResponse` is set.
- Signed access errors can be converted to `HTTPError` via `parseSignedAccessError`.

## Debugging

Enable scoped debugging with `DEBUG=md-oss:api-types*` to trace parameter parsing, performance timings, and controller responses. Namespaces include `md-oss:api-types:route`, `:performance`, and `:errors`.

## Exports

Key exports from the package entrypoint:

- Client: `createApiClient`, `parseHeaders`, `stripProxyAndWebsocketHeaders`, `ApiClient`
- Server: `createGenericController`, `createGenericRouteHandler`, `sendTypedResponse`, `parseRequestParameters`
- Types: `RouteRegistry`, `EndpointDefinition`, `InferApi`, `RouteHandler`, `ControllerFunction`, `RequestOptions`, `ExtractResolvedContext`, `PrefixRoutes`, `RouteKeys`, `MethodKeys`

See the source in `src/` for strategy interfaces (auth, context, permission tracking) and additional helpers.
