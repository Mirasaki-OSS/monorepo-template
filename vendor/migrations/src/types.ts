/**
 * Logger interface for migration operations
 */
export interface MigrationLogger {
	info: (message: string, meta?: Record<string, unknown>) => void;
	warn: (message: string, meta?: Record<string, unknown>) => void;
	error: (message: string, meta?: Record<string, unknown>) => void;
	debug: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Metadata about a migration execution
 */
export interface MigrationMetadata {
	runId: string;
	startedAt: Date;
	triggeredBy?: string;
}

/**
 * Base context available to all migrations
 */
export interface BaseMigrationContext {
	logger: MigrationLogger;
	metadata: MigrationMetadata;
	dryRun: boolean;
}

/**
 * Result of a migration validation
 */
export interface ValidationResult {
	valid: boolean;
	message?: string;
	warnings?: string[];
}

/**
 * Result of a migration execution
 */
export interface MigrationResult {
	name: string;
	status: 'completed' | 'failed' | 'skipped' | 'rolled-back';
	duration: number;
	startedAt: Date;
	completedAt: Date;
	error?: Error;
	recordsProcessed?: number;
	warnings?: string[];
	metadata?: Record<string, unknown>;
}

/**
 * Status of a single migration
 */
export interface MigrationStatus {
	name: string;
	description: string;
	isCompleted: boolean;
	canRollback: boolean;
	lastRun?: Date;
	error?: string;
}

/**
 * Overall migration system status
 */
export interface MigrationSystemStatus {
	total: number;
	pending: MigrationStatus[];
	completed: MigrationStatus[];
	failed: {
		currentlyFailing: MigrationStatus[];
		previouslyFailed: MigrationStatus[];
		recovered: MigrationStatus[];
	};
	running: MigrationStatus[];
}

/**
 * Core migration definition
 * @template TContext - Extended context type including consumer-specific properties
 */
export interface Migration<
	TContext extends BaseMigrationContext = BaseMigrationContext,
> {
	/** Unique identifier for this migration */
	name: string;

	/** Human-readable description */
	description: string;

	/** Check if this migration has already been completed */
	isCompleted: (context: TContext) => Promise<boolean>;

	/** Check if this migration is currently failing */
	isFailing: (context: TContext) => Promise<boolean>;

	/** Check if this migration has failed in a previous attempt */
	hasFailed: (context: TContext) => Promise<boolean>;

	/** Mark this migration as completed (called after successful execution) */
	markComplete: (context: TContext, result: MigrationResult) => Promise<void>;

	/** Mark this migration as failed (called after error) */
	markFailed: (context: TContext, error: Error) => Promise<void>;

	/** Mark this migration as rolled back (called after successful rollback) */
	markRollback: (context: TContext, result: MigrationResult) => Promise<void>;

	/** Execute the migration (apply changes) */
	up: (context: TContext) => Promise<void>;

	/** Optional: Rollback the migration (undo changes) */
	down?: (context: TContext) => Promise<void>;

	/** Optional: Validate prerequisites before execution */
	validate?: (context: TContext) => Promise<ValidationResult>;
}

/**
 * Options for running migrations
 */
export interface RunOptions {
	/** Skip migrations that are already completed */
	skipCompleted?: boolean;

	/** Continue running remaining migrations if one fails */
	continueOnError?: boolean;

	/** Maximum time to wait for a migration to complete (ms) */
	timeout?: number;

	/** Execute in dry-run mode (no changes applied) */
	dryRun?: boolean;

	/** Abort signal to cancel migration execution */
	signal?: AbortSignal;
}

/**
 * Options for migration registry
 */
export interface RegistryOptions {
	/** Enable debug logging */
	debug?: boolean;
}
