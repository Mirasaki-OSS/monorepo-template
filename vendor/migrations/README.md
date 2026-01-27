# @md-oss/migrations

Lightweight migration framework with registry, runner, progress tracking, validation, and rollback support.

## Features

- **Registry & Discovery** – Register migrations manually or auto-discover from files
- **Runner** – Execute pending migrations with optional dry-run, timeouts, and rollback
- **Validation** – Pre-flight validation hooks with warnings
- **Progress Tracking** – Built-in progress logger for long-running jobs
- **Rich Errors** – Specific error classes for duplicates, timeouts, rollbacks, and validation
- **Typed Contracts** – Strongly-typed migration context and results

## Installation

```bash
pnpm add @md-oss/migrations
```

## Quick Start

```typescript
import { MigrationRegistry, MigrationRunner, createDefaultLogger } from '@md-oss/migrations';
import type { Migration } from '@md-oss/migrations';
import crypto from 'node:crypto';

// 1) Define a migration
const addUsersIndex: Migration = {
	name: '2026-01-27-add-users-index',
	description: 'Add index on users(email)',
	async isCompleted() {
		return false; // check DB metadata
	},
	async isFailing() {
		return false;
	},
	async hasFailed() {
		return false;
	},
	async markComplete() {},
	async markFailed(_ctx, _err) {},
	async markRollback() {},
	async up(ctx) {
		ctx.logger.info('Running migration logic');
		// apply changes here
	},
	async down(ctx) {
		ctx.logger.info('Rolling back migration');
		// rollback changes here
	},
	async validate() {
		return { valid: true };
	},
};

// 2) Register migrations
const registry = new MigrationRegistry();
registry.register(addUsersIndex);

// 3) Run pending migrations
const runner = new MigrationRunner(registry, {
	logger: createDefaultLogger(),
	metadata: { runId: crypto.randomUUID(), startedAt: new Date() },
	dryRun: false,
});

await runner.runPending({ skipCompleted: true });
```

## Discover Migrations from Files

```typescript
import path from 'node:path';

const registry = new MigrationRegistry({ debug: true });
await registry.discoverFrom(path.join(process.cwd(), 'migrations'), {
	pattern: /\.migration\.(ts|js)$/,
	recursive: true,
});
```

## Runner Options

- `skipCompleted` – Skip migrations already marked complete (default: true)
- `continueOnError` – Keep running remaining migrations when one fails
- `timeout` – Fail a migration if it exceeds the timeout (ms)
- `dryRun` – Execute without calling `markComplete` / `markFailed`

## Progress Tracking

```typescript
import { MigrationProgress, createDefaultLogger } from '@md-oss/migrations';

const progress = new MigrationProgress(createDefaultLogger(), 1_000);
for (let i = 0; i < 1_000; i++) {
	// do work
	progress.increment();
}
progress.complete();
```

## Error Types

- MigrationAlreadyRunningError
- MigrationAlreadyCompletedError
- MigrationValidationError
- MigrationExecutionError
- MigrationRollbackError
- MigrationNotRollbackableError
- MigrationNotFoundError
- MigrationTimeoutError
- DuplicateMigrationError

## API Surface

- MigrationRegistry – register, discover, get, list migrations
- MigrationRunner – run/rollback migrations; run pending
- MigrationProgress – log long-running work
- createDefaultLogger / ConsoleLogger – colorful console logging
- Types: Migration, RunOptions, MigrationResult, MigrationStatus, MigrationSystemStatus, MigrationLogger
