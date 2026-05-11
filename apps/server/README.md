# @md-oss/server

Hono-based HTTP server for the monorepo template.

## Table of Contents

- [Overview](#overview)
- [Development](#development)
- [Routes](#routes)
- [Structure](#structure)

## Overview

This app hosts the server-side runtime for the template. It wires together:

- Hono for the HTTP application and middleware stack
- `@hono/trpc-server` for the tRPC transport
- `@md-oss/api` for routers and request context
- `@md-oss/auth` for Better Auth handlers

## Development

```bash
pnpm --filter @md-oss/server dev
pnpm --filter @md-oss/server build
pnpm --filter @md-oss/server start
pnpm --filter @md-oss/server typecheck
```

The server listens on `SERVER_PORT` and applies CORS using `CORS_ORIGIN` from its environment module.

## Routes

The current application surface is intentionally small:

- `GET /` returns a plain `OK` response for a basic health probe.
- `GET|POST /api/auth/*` delegates to the Better Auth handler.
- `/trpc/*` exposes the tRPC API defined in `@md-oss/api`.

## Structure

- `src/index.ts` starts the Node server and handles graceful shutdown.
- `src/app.ts` configures middleware, CORS, auth routing, and tRPC routing.
- `src/env.ts` validates runtime configuration.
- `@md-oss/api`, `@md-oss/auth`, and `@md-oss/db` provide the shared application logic used by the server.
