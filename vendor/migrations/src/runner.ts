import { randomUUID } from 'node:crypto';
import {
	MigrationAlreadyCompletedError,
	MigrationAlreadyRunningError,
	MigrationExecutionError,
	MigrationNotRollbackableError,
	MigrationRollbackError,
	MigrationTimeoutError,
	MigrationValidationError,
} from './errors';
import type { MigrationRegistry } from './registry';
import type {
	BaseMigrationContext,
	MigrationMetadata,
	MigrationResult,
	MigrationSystemStatus,
	RunOptions,
} from './types';

/**
 * Migration runner - executes migrations from a registry
 */
export class MigrationRunner<
	TContext extends BaseMigrationContext = BaseMigrationContext,
> {
	private runningMigrations = new Set<string>();

	constructor(
		private registry: MigrationRegistry<TContext>,
		private context: Omit<TContext, 'dryRun' | 'metadata'>
	) {}

	/**
	 * Run all pending migrations
	 */
	async runPending(options: RunOptions = {}): Promise<MigrationResult[]> {
		const fullContext = this.buildContext(options);
		const { skipCompleted = true, continueOnError = false } = options;

		fullContext.logger.info('Starting pending migrations...');

		const allMigrations = this.registry.getAll();
		const results: MigrationResult[] = [];

		for (const migration of allMigrations) {
			try {
				// Check if already completed
				if (skipCompleted && (await migration.isCompleted(fullContext))) {
					fullContext.logger.info(
						`Skipping completed migration: ${migration.name}`
					);
					results.push({
						name: migration.name,
						status: 'skipped',
						duration: 0,
						startedAt: new Date(),
						completedAt: new Date(),
					});
					continue;
				}

				const result = await this.run(migration.name, options);
				results.push(result);
			} catch (error) {
				fullContext.logger.error(`Migration ${migration.name} failed`, {
					error: error instanceof Error ? error.message : String(error),
				});

				results.push({
					name: migration.name,
					status: 'failed',
					duration: 0,
					startedAt: new Date(),
					completedAt: new Date(),
					error: error instanceof Error ? error : new Error(String(error)),
				});

				if (!continueOnError) {
					throw error;
				}
			}
		}

		const completed = results.filter((r) => r.status === 'completed').length;
		const failed = results.filter((r) => r.status === 'failed').length;
		const skipped = results.filter((r) => r.status === 'skipped').length;

		fullContext.logger.info('All pending migrations processed', {
			total: results.length,
			completed,
			failed,
			skipped,
		});

		return results;
	}

	/**
	 * Run a specific migration by name
	 */
	async run(
		migrationName: string,
		options: RunOptions = {}
	): Promise<MigrationResult> {
		const migration = this.registry.get(migrationName);
		const fullContext = this.buildContext(options);
		const { skipCompleted = true, timeout } = options;

		// Check if already running
		if (this.runningMigrations.has(migrationName)) {
			throw new MigrationAlreadyRunningError(migrationName);
		}

		// Check if already completed
		const isCompleted = await migration.isCompleted(fullContext);
		if (skipCompleted && isCompleted) {
			if (!fullContext.dryRun) {
				throw new MigrationAlreadyCompletedError(migrationName);
			}
		}

		this.runningMigrations.add(migrationName);

		try {
			const startTime = Date.now();
			fullContext.logger.info(
				fullContext.dryRun
					? `[DRY RUN] Starting migration: ${migrationName}`
					: `Starting migration: ${migrationName}`,
				{ description: migration.description }
			);

			// Validate if validation function exists
			if (migration.validate) {
				const validation = await migration.validate(fullContext);
				if (!validation.valid) {
					throw new MigrationValidationError(
						migrationName,
						validation.message || 'Validation failed'
					);
				}

				if (validation.warnings && validation.warnings.length > 0) {
					for (const warning of validation.warnings) {
						fullContext.logger.warn(warning);
					}
				}
			}

			// Execute migration with optional timeout
			if (timeout) {
				await this.runWithTimeout(
					() => migration.up(fullContext),
					timeout,
					migrationName
				);
			} else {
				await migration.up(fullContext);
			}

			const duration = Date.now() - startTime;
			const result: MigrationResult = {
				name: migrationName,
				status: 'completed',
				duration,
				startedAt: new Date(startTime),
				completedAt: new Date(),
			};

			// Mark as complete (unless dry run)
			if (!fullContext.dryRun) {
				await migration.markComplete(fullContext, result);
			}

			fullContext.logger.info(
				fullContext.dryRun
					? `[DRY RUN] Migration completed: ${migrationName}`
					: `Migration completed: ${migrationName}`,
				{ duration: `${duration}ms` }
			);

			return result;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));

			fullContext.logger.error(`Migration failed: ${migrationName}`, {
				error: err.message,
				stack: err.stack,
			});

			// Mark as failed (unless dry run)
			if (!fullContext.dryRun) {
				await migration.markFailed(fullContext, err);
			}

			throw new MigrationExecutionError(migrationName, err);
		} finally {
			this.runningMigrations.delete(migrationName);
		}
	}

	/**
	 * Rollback a specific migration by name
	 */
	async rollback(
		migrationName: string,
		options: RunOptions = {}
	): Promise<MigrationResult> {
		const migration = this.registry.get(migrationName);
		const fullContext = this.buildContext(options);
		const { timeout } = options;

		// Check if rollback is supported
		if (!migration.down) {
			throw new MigrationNotRollbackableError(migrationName);
		}

		// Check if migration is running
		if (this.runningMigrations.has(migrationName)) {
			throw new MigrationAlreadyRunningError(migrationName);
		}

		this.runningMigrations.add(migrationName);

		try {
			const startTime = Date.now();
			fullContext.logger.info(
				fullContext.dryRun
					? `[DRY RUN] Rolling back migration: ${migrationName}`
					: `Rolling back migration: ${migrationName}`
			);

			// Execute rollback with optional timeout
			if (timeout) {
				await this.runWithTimeout(
					async () => {
						if (!migration.down) {
							throw new Error('Rollback function not defined');
						}
						await migration.down(fullContext);
					},
					timeout,
					migrationName
				);
			} else {
				await migration.down(fullContext);
			}

			const duration = Date.now() - startTime;
			const result: MigrationResult = {
				name: migrationName,
				status: 'rolled-back',
				duration,
				startedAt: new Date(startTime),
				completedAt: new Date(),
			};

			fullContext.logger.info(
				fullContext.dryRun
					? `[DRY RUN] Migration rolled back: ${migrationName}`
					: `Migration rolled back: ${migrationName}`,
				{ duration: `${duration}ms` }
			);

			if (!fullContext.dryRun) {
				await migration.markRollback(fullContext, result);
			}

			return result;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));

			fullContext.logger.error(`Rollback failed: ${migrationName}`, {
				error: err.message,
				stack: err.stack,
			});

			throw new MigrationRollbackError(migrationName, err);
		} finally {
			this.runningMigrations.delete(migrationName);
		}
	}

	/**
	 * Get the status of all migrations
	 */
	async getStatus(): Promise<MigrationSystemStatus> {
		const fullContext = this.buildContext({});
		const allMigrations = this.registry.getAll();

		const statuses = await Promise.all(
			allMigrations.map(async (migration) => {
				const [isCompleted, isFailing, hasFailed, isRunning] =
					await Promise.all([
						migration.isCompleted(fullContext),
						migration.isFailing(fullContext),
						migration.hasFailed(fullContext),
						Promise.resolve(this.runningMigrations.has(migration.name)),
					]);

				return {
					name: migration.name,
					description: migration.description,
					isCompleted,
					isFailing,
					hasFailed,
					isRunning,
					canRollback: !!migration.down,
				};
			})
		);

		return {
			total: statuses.length,
			pending: statuses.filter(
				(s) => !s.isCompleted && !s.hasFailed && !s.isRunning
			),
			completed: statuses.filter((s) => s.isCompleted && !s.isRunning),
			failed: {
				currentlyFailing: statuses.filter((s) => s.isFailing && !s.isRunning),
				previouslyFailed: statuses.filter((s) => s.hasFailed && !s.isRunning),
				recovered: statuses.filter(
					(s) => s.isCompleted && !s.isFailing && s.hasFailed && !s.isRunning
				),
			},
			running: statuses.filter((s) => s.isRunning),
		};
	}

	/**
	 * Build full context from partial context
	 */
	private buildContext(
		partial: Partial<Pick<RunOptions, 'dryRun' | 'signal'>>
	) {
		const metadata: MigrationMetadata = {
			runId: randomUUID(),
			startedAt: new Date(),
			triggeredBy: (
				partial as {
					triggeredBy?: string;
				}
			).triggeredBy,
		};

		return {
			...this.context,
			...partial,
			metadata,
			dryRun: partial.dryRun ?? false,
		} as TContext & {
			metadata: MigrationMetadata;
		};
	}

	/**
	 * Run a function with a timeout
	 */
	private async runWithTimeout(
		fn: () => Promise<void>,
		timeout: number,
		migrationName: string
	): Promise<void> {
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				reject(new MigrationTimeoutError(migrationName, timeout));
			}, timeout);
		});

		await Promise.race([fn(), timeoutPromise]);
	}
}
