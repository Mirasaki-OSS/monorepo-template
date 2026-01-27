/**
 * Base error class for all migration errors
 */
export class MigrationError extends Error {
	constructor(
		message: string,
		public readonly migrationName?: string,
		public readonly code?: string
	) {
		super(message);
		this.name = 'MigrationError';
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Thrown when a migration is already running
 */
export class MigrationAlreadyRunningError extends MigrationError {
	constructor(migrationName: string) {
		super(
			`Migration "${migrationName}" is already running`,
			migrationName,
			'MIGRATION_ALREADY_RUNNING'
		);
		this.name = 'MigrationAlreadyRunningError';
	}
}

/**
 * Thrown when a migration has already been completed
 */
export class MigrationAlreadyCompletedError extends MigrationError {
	constructor(migrationName: string) {
		super(
			`Migration "${migrationName}" has already been completed`,
			migrationName,
			'MIGRATION_ALREADY_COMPLETED'
		);
		this.name = 'MigrationAlreadyCompletedError';
	}
}

/**
 * Thrown when a migration validation fails
 */
export class MigrationValidationError extends MigrationError {
	constructor(
		migrationName: string,
		public readonly validationMessage: string
	) {
		super(
			`Migration "${migrationName}" validation failed: ${validationMessage}`,
			migrationName,
			'MIGRATION_VALIDATION_FAILED'
		);
		this.name = 'MigrationValidationError';
	}
}

/**
 * Thrown when a migration execution fails
 */
export class MigrationExecutionError extends MigrationError {
	constructor(
		migrationName: string,
		public override readonly cause: Error
	) {
		super(
			`Migration "${migrationName}" execution failed: ${cause.message}`,
			migrationName,
			'MIGRATION_EXECUTION_FAILED'
		);
		this.name = 'MigrationExecutionError';
		this.stack = cause.stack;
	}
}

/**
 * Thrown when a migration rollback fails
 */
export class MigrationRollbackError extends MigrationError {
	constructor(
		migrationName: string,
		public override readonly cause: Error
	) {
		super(
			`Migration "${migrationName}" rollback failed: ${cause.message}`,
			migrationName,
			'MIGRATION_ROLLBACK_FAILED'
		);
		this.name = 'MigrationRollbackError';
		this.stack = cause.stack;
	}
}

/**
 * Thrown when attempting to rollback a migration that doesn't support it
 */
export class MigrationNotRollbackableError extends MigrationError {
	constructor(migrationName: string) {
		super(
			`Migration "${migrationName}" does not support rollback`,
			migrationName,
			'MIGRATION_NOT_ROLLBACKABLE'
		);
		this.name = 'MigrationNotRollbackableError';
	}
}

/**
 * Thrown when a migration is not found in the registry
 */
export class MigrationNotFoundError extends MigrationError {
	constructor(migrationName: string) {
		super(
			`Migration "${migrationName}" not found in registry`,
			migrationName,
			'MIGRATION_NOT_FOUND'
		);
		this.name = 'MigrationNotFoundError';
	}
}

/**
 * Thrown when a migration times out
 */
export class MigrationTimeoutError extends MigrationError {
	constructor(
		migrationName: string,
		public readonly timeout: number
	) {
		super(
			`Migration "${migrationName}" timed out after ${timeout}ms`,
			migrationName,
			'MIGRATION_TIMEOUT'
		);
		this.name = 'MigrationTimeoutError';
	}
}

/**
 * Thrown when attempting to register a duplicate migration
 */
export class DuplicateMigrationError extends MigrationError {
	constructor(migrationName: string) {
		super(
			`Migration "${migrationName}" is already registered`,
			migrationName,
			'DUPLICATE_MIGRATION'
		);
		this.name = 'DuplicateMigrationError';
	}
}
