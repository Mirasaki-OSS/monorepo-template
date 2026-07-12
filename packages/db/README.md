# @md-oss/db

Drizzle ORM database layer for PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Exports](#exports)
- [Usage](#usage)
- [Migration Commands](#migration-commands)
- [Development](#development)

## Overview

This package owns the database connection factory, schema exports, environment parsing, and migration scripts used by the server and auth packages. It is built on `drizzle-orm`, `pg`, and `drizzle-kit`.

## Exports

The package currently exposes:

- `createDb` and `db` from `@md-oss/db`
- environment helpers from `@md-oss/db/env`
- schema modules from `@md-oss/db/schema` and `@md-oss/db/schema/auth`
- zod helpers from `@md-oss/db/zod`
- shared types from `@md-oss/db/types`

## Usage

```typescript
import { db } from '@md-oss/db';
import { user } from '@md-oss/db/schema/auth';
import { eq } from '@md-oss/db';

const rows = await db.select().from(user).where(eq(user.email, 'user@example.com'));
```

```typescript
import { createDb } from '@md-oss/db';

const scopedDb = createDb();
```

## Migration Commands

```bash
pnpm --filter @md-oss/db db:ensure
pnpm --filter @md-oss/db db:generate
pnpm --filter @md-oss/db db:migrate
pnpm --filter @md-oss/db db:push
pnpm --filter @md-oss/db db:deploy
pnpm --filter @md-oss/db db:studio
pnpm --filter @md-oss/db db:seed:dev -- --count 10000 --batch-size 1000 --truncate
```

- `db:ensure` creates the target database when it does not already exist.
- `db:generate` generates SQL migrations from the schema.
- `db:migrate` runs generated migrations.
- `db:push` applies the current schema directly.
- `db:deploy` is the idempotent deployment entrypoint used by containerized production deploys.
- `db:studio` opens Drizzle Studio against the configured database.
- `db:seed:dev` generates large fake datasets with faker for development only.

## Development

```bash
pnpm --filter @md-oss/db dev
pnpm --filter @md-oss/db build
pnpm --filter @md-oss/db typecheck
```
