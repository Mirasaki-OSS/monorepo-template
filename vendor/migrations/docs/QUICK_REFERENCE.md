# Quick Reference

## Basic Setup

```typescript
import { MigrationRegistry, MigrationRunner, Migration } from '@md-oss/migrations';

// 1. Define context type
type AppContext = BaseMigrationContext & { prisma: PrismaClient };

// 2. Create registry & runner
const registry = new MigrationRegistry<AppContext>();
const runner = new MigrationRunner(registry);

// 3. Register migrations
registry.register(myMigration);
// OR auto-discover
await registry.discoverFrom('./migrations', { pattern: /\.migration\.(ts|js)$/ });
```

## Migration Template

```typescript
export const myMigration: Migration<AppContext> = {
  name: 'my-migration-name',
  description: 'What this does',
  
  isCompleted: async (ctx) => {
    // Check if already ran
    const record = await ctx.prisma.migration.findUnique({
      where: { name: 'my-migration-name' }
    });
    return record?.completed === true;
  },
  
  markComplete: async (ctx, result) => {
    // Save success
    await ctx.prisma.migration.upsert({
      where: { name: 'my-migration-name' },
      create: { name: 'my-migration-name', completed: true, duration: result.duration },
      update: { completed: true, duration: result.duration },
    });
  },
  
  markFailed: async (ctx, error) => {
    // Save failure
    await ctx.prisma.migration.upsert({
      where: { name: 'my-migration-name' },
      create: { name: 'my-migration-name', error: error.message },
      update: { error: error.message },
    });
  },
  
  markRollback: async (ctx, result) => {
    // Save rollback
    await ctx.prisma.migration.upsert({
      where: { name: 'my-migration-name' },
      create: { name: 'my-migration-name', rolledBack: true, duration: result.duration },
      update: { rolledBack: true, duration: result.duration, error: null },
    });
  },
  
  validate: async (ctx) => {
    // Optional: Check prerequisites
    return { valid: true };
  },
  
  up: async (ctx) => {
    // Do the work
    if (ctx.dryRun) {
      ctx.logger.info('[DRY RUN] Would do X');
      return;
    }
    // ... actual work
  },
  
  down: async (ctx) => {
    // Optional: Rollback
  },
};
```

## Running Migrations

```typescript
// Run all pending
await runner.runPending({ prisma });

// Run specific
await runner.run('my-migration', { prisma });

// Dry run (preview)
await runner.run('my-migration', { prisma, dryRun: true });

// With timeout
await runner.run('my-migration', { prisma }, { timeout: 300000 });

// Rollback
await runner.rollback('my-migration', { prisma });

// Get status
const status = await runner.getStatus({ prisma });
```

## Progress Tracking

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

## Error Types

- `MigrationError` - Base error
- `MigrationAlreadyRunningError` - Currently executing
- `MigrationAlreadyCompletedError` - Already done
- `MigrationValidationError` - Validation failed
- `MigrationExecutionError` - Execution failed
- `MigrationRollbackError` - Rollback failed
- `MigrationNotRollbackableError` - No rollback support
- `MigrationNotFoundError` - Not in registry
- `MigrationTimeoutError` - Exceeded timeout
- `DuplicateMigrationError` - Duplicate registration

## Common Patterns

### Database State Tracking
```typescript
isCompleted: async (ctx) => {
  const record = await ctx.prisma.migration.findUnique({ where: { name } });
  return record?.completed === true;
}
```

### Cache State Tracking
```typescript
isCompleted: async (ctx) => {
  return await ctx.cache.get(`migration:${name}:completed`) === 'true';
}
```

### File State Tracking
```typescript
isCompleted: async (ctx) => {
  try {
    await fs.access(`.migrations/${name}.done`);
    return true;
  } catch { return false; }
}
```

### Batch Processing
```typescript
up: async (ctx) => {
  const BATCH_SIZE = 1000;
  let skip = 0;
  let batch;
  
  do {
    batch = await ctx.prisma.item.findMany({ skip, take: BATCH_SIZE });
    for (const item of batch) await processItem(item);
    skip += BATCH_SIZE;
  } while (batch.length === BATCH_SIZE);
}
```

### Error Tolerance
```typescript
up: async (ctx) => {
  const errors = [];
  for (const item of items) {
    try {
      await processItem(item);
    } catch (error) {
      errors.push({ item, error });
    }
  }
  
  if (errors.length > items.length * 0.1) {
    throw new Error(`Too many failures: ${errors.length}/${items.length}`);
  }
}
```

## CLI Script Template

```typescript
// scripts/migrate.ts
import { runner } from '../migrations';
import { prisma } from '@mirasaki/database';

const [command, name] = process.argv.slice(2);
const dryRun = process.argv.includes('--dry-run');

switch (command) {
  case 'run':
    await (name ? runner.run(name, { prisma, dryRun }) : runner.runPending({ prisma, dryRun }));
    break;
  case 'rollback':
    await runner.rollback(name, { prisma, dryRun });
    break;
  case 'status':
    console.log(await runner.getStatus({ prisma }));
    break;
}
```

Usage:
```bash
pnpm tsx scripts/migrate.ts run                        # Run all pending
pnpm tsx scripts/migrate.ts run my-migration           # Run specific
pnpm tsx scripts/migrate.ts run my-migration --dry-run # Dry run
pnpm tsx scripts/migrate.ts rollback my-migration      # Rollback
pnpm tsx scripts/migrate.ts status                     # Check status
```
