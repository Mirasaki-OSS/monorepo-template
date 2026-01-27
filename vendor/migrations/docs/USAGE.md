# Migration System Usage Guide

Complete guide for using `@md-oss/migrations` in production.

## Table of Contents

1. [Architecture](#architecture)
2. [Setup](#setup)
3. [Creating Migrations](#creating-migrations)
4. [Running Migrations](#running-migrations)
5. [Integration Patterns](#integration-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Architecture

The migration system consists of three main components:

1. **MigrationRegistry** - Stores and manages migration definitions
2. **MigrationRunner** - Executes migrations with proper error handling
3. **Migration** - Individual migration definition with state management

```
┌─────────────────┐
│  Application    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ MigrationRunner │────▶│ MigrationRegistry│
└────────┬────────┘     └──────────────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐
         └─────────────▶│   Migration(s)   │
                        └──────────────────┘
```

## Setup

### 1. Database Schema

First, create a table to track migration state (Prisma example):

```prisma
// schema.prisma
model Migration {
  id            String    @id @default(cuid())
  name          String    @unique
  description   String?
  completed     Boolean   @default(false)
  completedAt   DateTime?
  duration      Int?
  error         String?
  lastAttemptAt DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 2. Define Your Context Type

```typescript
// migrations/types.ts
import type { BaseMigrationContext } from '@md-oss/migrations';
import type { PrismaClient } from '@prisma/client';

export type AppMigrationContext = BaseMigrationContext & {
  prisma: PrismaClient;
  storage?: StorageService;
  cache?: CacheService;
};
```

### 3. Create Registry and Runner

```typescript
// migrations/index.ts
import { MigrationRegistry, MigrationRunner } from '@md-oss/migrations';
import type { AppMigrationContext } from './types';

export const registry = new MigrationRegistry<AppMigrationContext>({
  debug: process.env.NODE_ENV === 'development',
});

export const runner = new MigrationRunner(registry);

// Auto-discover migrations from directory
await registry.discoverFrom(
  path.join(__dirname, './migrations'),
  {
    pattern: /\.migration\.(ts|js)$/,
    recursive: true,
  }
);
```

## Creating Migrations

### Basic Structure

```typescript
// migrations/my-migration.migration.ts
import type { Migration } from '@md-oss/migrations';
import type { AppMigrationContext } from './types';

export const myMigration: Migration<AppMigrationContext> = {
  name: 'unique-migration-name',
  description: 'Human-readable description',
  
  isCompleted: async (ctx) => {
    // Return true if migration already ran
  },
  
  markComplete: async (ctx, result) => {
    // Save completion state
  },
  
  markFailed: async (ctx, error) => {
    // Save failure state
  },
  
  up: async (ctx) => {
    // Do the actual work
  },
  
  // Optional
  down: async (ctx) => {
    // Undo the work
  },
  
  // Optional
  validate: async (ctx) => {
    // Check prerequisites
    return { valid: true };
  },
};
```

### State Management Patterns

#### Pattern 1: Database Table (Recommended)

```typescript
isCompleted: async (ctx) => {
  const record = await ctx.prisma.migration.findUnique({
    where: { name: 'my-migration' },
  });
  return record?.completed === true;
},

markComplete: async (ctx, result) => {
  await ctx.prisma.migration.upsert({
    where: { name: 'my-migration' },
    create: {
      name: 'my-migration',
      completed: true,
      completedAt: new Date(),
      duration: result.duration,
    },
    update: {
      completed: true,
      completedAt: new Date(),
      duration: result.duration,
    },
  });
},

markFailed: async (ctx, error) => {
  await ctx.prisma.migration.upsert({
    where: { name: 'my-migration' },
    create: {
      name: 'my-migration',
      completed: false,
      error: error.message,
    },
    update: {
      error: error.message,
      lastAttemptAt: new Date(),
    },
  });
},
```

#### Pattern 2: Redis/Cache

```typescript
isCompleted: async (ctx) => {
  const value = await ctx.cache.get(`migration:${name}:completed`);
  return value === 'true';
},

markComplete: async (ctx, result) => {
  await ctx.cache.set(`migration:${name}:completed`, 'true', { 
    ttl: null // No expiration
  });
  await ctx.cache.set(`migration:${name}:result`, JSON.stringify(result));
},

markFailed: async (ctx, error) => {
  await ctx.cache.set(`migration:${name}:error`, error.message);
},
```

#### Pattern 3: File System

```typescript
import * as fs from 'fs/promises';

isCompleted: async (ctx) => {
  try {
    await fs.access('.migrations/my-migration.done');
    return true;
  } catch {
    return false;
  }
},

markComplete: async (ctx, result) => {
  await fs.mkdir('.migrations', { recursive: true });
  await fs.writeFile(
    '.migrations/my-migration.done',
    JSON.stringify(result)
  );
},

markFailed: async (ctx, error) => {
  await fs.mkdir('.migrations', { recursive: true });
  await fs.writeFile(
    '.migrations/my-migration.error',
    error.message
  );
},
```

## Running Migrations

### Option 1: API Endpoint

```typescript
// apps/api/src/v1/routes/migrations.ts
import { router, protectedProcedure } from '@/lib/trpc';
import { z } from 'zod';
import { runner } from '@/migrations';
import { prisma } from '@mirasaki/database/client';

export const migrationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const status = await runner.getStatus({ 
      prisma,
      triggeredBy: ctx.session.user.id,
    });
    return status;
  }),

  run: protectedProcedure
    .input(z.object({
      name: z.string(),
      dryRun: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await runner.run(input.name, {
        prisma,
        dryRun: input.dryRun,
        triggeredBy: ctx.session.user.id,
      });
      return result;
    }),

  runPending: protectedProcedure
    .input(z.object({
      dryRun: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const results = await runner.runPending({
        prisma,
        dryRun: input.dryRun,
        triggeredBy: ctx.session.user.id,
      });
      return results;
    }),

  rollback: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await runner.rollback(input.name, {
        prisma,
        triggeredBy: ctx.session.user.id,
      });
      return result;
    }),
});
```

### Option 2: Application Startup

```typescript
// apps/api/src/server.ts
import { runner } from '@/migrations';
import { prisma } from '@mirasaki/database/client';

async function startServer() {
  // Run pending migrations before starting
  console.log('Running pending migrations...');
  
  try {
    await runner.runPending(
      { prisma },
      { 
        skipCompleted: true,
        continueOnError: false,
      }
    );
    console.log('✓ Migrations complete');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }

  // Start server...
  app.listen(3000);
}
```

### Option 3: CLI Script

```typescript
// scripts/migrate.ts
import { runner, registry } from '../migrations';
import { prisma } from '@mirasaki/database/client';

const args = process.argv.slice(2);
const command = args[0];
const migrationName = args[1];
const dryRun = args.includes('--dry-run');

async function main() {
  switch (command) {
    case 'run':
      if (migrationName) {
        await runner.run(migrationName, { prisma, dryRun });
      } else {
        await runner.runPending({ prisma, dryRun });
      }
      break;

    case 'rollback':
      if (!migrationName) {
        throw new Error('Migration name required for rollback');
      }
      await runner.rollback(migrationName, { prisma, dryRun });
      break;

    case 'status':
      const status = await runner.getStatus({ prisma });
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'list':
      const names = registry.getNames();
      console.log('Available migrations:');
      names.forEach(name => console.log(`  - ${name}`));
      break;

    default:
      console.log('Usage:');
      console.log('  pnpm migrate run [name] [--dry-run]');
      console.log('  pnpm migrate rollback <name> [--dry-run]');
      console.log('  pnpm migrate status');
      console.log('  pnpm migrate list');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
# Run all pending
pnpm tsx scripts/migrate.ts run

# Run specific migration
pnpm tsx scripts/migrate.ts run import-legacy-users

# Dry run
pnpm tsx scripts/migrate.ts run import-legacy-users --dry-run

# Rollback
pnpm tsx scripts/migrate.ts rollback import-legacy-users

# Check status
pnpm tsx scripts/migrate.ts status

# List migrations
pnpm tsx scripts/migrate.ts list
```

## Integration Patterns

### With Express.js

```typescript
import express from 'express';
import { runner } from '@/migrations';

const app = express();

app.post('/api/migrations/run', async (req, res) => {
  try {
    const { name, dryRun } = req.body;
    
    const result = await runner.run(name, {
      prisma,
      dryRun: dryRun || false,
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});
```

### With Next.js API Route

```typescript
// app/api/migrations/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runner } from '@/migrations';
import { prisma } from '@mirasaki/database/client';

export async function POST(request: NextRequest) {
  const { name, dryRun } = await request.json();

  try {
    const result = await runner.run(name, {
      prisma,
      dryRun: dryRun || false,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

## Best Practices

### 1. Always Test with Dry Run First

```typescript
// Test first
const preview = await runner.run('my-migration', {
  prisma,
  dryRun: true,
});

// Review preview, then execute
const result = await runner.run('my-migration', { prisma });
```

### 2. Use Progress Tracking for Large Datasets

```typescript
import { MigrationProgress } from '@md-oss/migrations';

up: async (ctx) => {
  const items = await fetchItems();
  const progress = new MigrationProgress(ctx.logger, items.length);
  
  for (const item of items) {
    await processItem(item);
    progress.increment();
  }
  
  progress.complete();
}
```

### 3. Handle Errors Gracefully

```typescript
up: async (ctx) => {
  const errors = [];
  
  for (const item of items) {
    try {
      await processItem(item);
    } catch (error) {
      ctx.logger.error(`Failed to process ${item.id}`, { error });
      errors.push({ item, error });
    }
  }
  
  if (errors.length > items.length * 0.1) {
    throw new Error(`Too many failures: ${errors.length}/${items.length}`);
  }
}
```

### 4. Add Validation

```typescript
validate: async (ctx) => {
  const warnings = [];
  
  // Check data size
  const count = await ctx.prisma.user.count();
  if (count > 10000) {
    warnings.push('Large dataset - this will take time');
  }
  
  // Check prerequisites
  if (!process.env.LEGACY_DB_URL) {
    return {
      valid: false,
      message: 'LEGACY_DB_URL environment variable not set',
    };
  }
  
  return { valid: true, warnings };
}
```

### 5. Use Descriptive Names

```typescript
// Good
'2024-12-19-import-legacy-users'
'2025-01-15-migrate-tenant-env-to-database'
'2025-02-01-cleanup-orphaned-files'

// Bad
'migration1'
'fix-data'
'temp'
```

### 6. Add Timeouts for Long Operations

```typescript
await runner.run(
  'long-migration',
  { prisma },
  {
    timeout: 600000, // 10 minutes
  }
);
```

## Troubleshooting

### Migration Stuck in Running State

If a migration crashes mid-execution, it may remain in the "running" state in the runner's memory. This is cleared on restart, but to manually resolve:

```typescript
// The runner tracks running migrations in memory only
// Restart your application to clear the running state
```

### Migration Marked Complete But Needs to Run Again

```typescript
// Delete the completion marker
await prisma.migration.delete({
  where: { name: 'my-migration' },
});

// Or update it
await prisma.migration.update({
  where: { name: 'my-migration' },
  data: { completed: false },
});
```

### Migration Fails with Timeout

Increase the timeout:

```typescript
await runner.run(
  'my-migration',
  { prisma },
  { timeout: 1800000 } // 30 minutes
);
```

Or remove the timeout entirely (not recommended for production):

```typescript
await runner.run('my-migration', { prisma }); // No timeout
```

### Auto-Discovery Not Finding Migrations

Check the file pattern and path:

```typescript
await registry.discoverFrom(
  path.resolve(__dirname, './migrations'),
  {
    pattern: /\.migration\.(ts|js)$/,
    recursive: true,
  }
);
```

Enable debug logging:

```typescript
const registry = new MigrationRegistry({ debug: true });
```

### TypeScript Errors with Context

Ensure your context properly extends `BaseMigrationContext`:

```typescript
type MyContext = BaseMigrationContext & {
  prisma: PrismaClient;
};

// When running, provide all required fields
await runner.run('my-migration', {
  prisma,
  // logger, metadata, dryRun are added automatically
});
```
