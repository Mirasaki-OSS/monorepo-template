import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DuplicateMigrationError, MigrationNotFoundError } from './errors';
import type { BaseMigrationContext, Migration, RegistryOptions } from './types';

/**
 * Registry for managing migrations
 */
export class MigrationRegistry<
	TContext extends BaseMigrationContext = BaseMigrationContext,
> {
	private migrations = new Map<string, Migration<TContext>>();
	private options: RegistryOptions;

	constructor(options: RegistryOptions = {}) {
		this.options = options;
	}

	/**
	 * Register a migration
	 */
	register(migration: Migration<TContext>): void {
		if (this.migrations.has(migration.name)) {
			throw new DuplicateMigrationError(migration.name);
		}

		this.migrations.set(migration.name, migration);

		if (this.options.debug) {
			console.debug(
				`[MigrationRegistry] Registered migration: ${migration.name}`
			);
		}
	}

	/**
	 * Register multiple migrations at once
	 */
	registerMany(migrations: Migration<TContext>[]): void {
		for (const migration of migrations) {
			this.register(migration);
		}
	}

	/**
	 * Get a migration by name
	 */
	get(name: string): Migration<TContext> {
		const migration = this.migrations.get(name);

		if (!migration) {
			throw new MigrationNotFoundError(name);
		}

		return migration;
	}

	/**
	 * Check if a migration exists
	 */
	has(name: string): boolean {
		return this.migrations.has(name);
	}

	/**
	 * Get all registered migrations
	 */
	getAll(): Migration<TContext>[] {
		return Array.from(this.migrations.values());
	}

	/**
	 * Get all migration names
	 */
	getNames(): string[] {
		return Array.from(this.migrations.keys());
	}

	/**
	 * Get count of registered migrations
	 */
	count(): number {
		return this.migrations.size;
	}

	/**
	 * Clear all migrations from registry
	 */
	clear(): void {
		this.migrations.clear();
	}

	/**
	 * Auto-discover and register migrations from a directory
	 *
	 * @param directory - Absolute path to directory containing migration files
	 * @param options - Discovery options
	 */
	async discoverFrom(
		directory: string,
		options: {
			/** File pattern to match (default: "*.migration.{ts,js}") */
			pattern?: RegExp;
			/** Recursively search subdirectories */
			recursive?: boolean;
		} = {}
	): Promise<number> {
		const { pattern = /\.migration\.(ts|js)$/, recursive = false } = options;

		const discovered: Migration<TContext>[] = [];

		try {
			const files = await this.scanDirectory(directory, pattern, recursive);

			for (const file of files) {
				try {
					const migrations = await this.loadMigrationFile(file);
					discovered.push(...migrations);
				} catch (error) {
					if (this.options.debug) {
						console.error(
							`[MigrationRegistry] Failed to load migration from ${file}:`,
							error
						);
					}
				}
			}

			this.registerMany(discovered);

			if (this.options.debug) {
				console.debug(
					`[MigrationRegistry] Discovered ${discovered.length} migrations from ${directory}`
				);
			}

			return discovered.length;
		} catch (error) {
			if (this.options.debug) {
				console.error(
					`[MigrationRegistry] Failed to discover migrations from ${directory}:`,
					error
				);
			}
			throw error;
		}
	}

	/**
	 * Scan directory for migration files
	 */
	private async scanDirectory(
		directory: string,
		pattern: RegExp,
		recursive: boolean
	): Promise<string[]> {
		const files: string[] = [];

		try {
			const entries = await fs.readdir(directory, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(directory, entry.name);

				if (entry.isDirectory() && recursive) {
					const subFiles = await this.scanDirectory(
						fullPath,
						pattern,
						recursive
					);
					files.push(...subFiles);
				} else if (entry.isFile() && pattern.test(entry.name)) {
					files.push(fullPath);
				}
			}
		} catch (error) {
			// Directory doesn't exist or not accessible
			if (this.options.debug) {
				console.debug(
					`[MigrationRegistry] Cannot scan directory ${directory}:`,
					error
				);
			}
		}

		return files;
	}

	/**
	 * Load migration(s) from a file
	 */
	private async loadMigrationFile(
		filePath: string
	): Promise<Migration<TContext>[]> {
		// Dynamic import works for both .ts (with ts-node/tsx) and .js
		const module = await import(filePath);

		const migrations: Migration<TContext>[] = [];

		// Support different export patterns:
		// 1. export default migration
		// 2. export const migration = ...
		// 3. export const migrations = [...]
		// 4. Named exports that are migration objects

		if (module.default) {
			if (this.isMigration(module.default)) {
				migrations.push(module.default);
			} else if (Array.isArray(module.default)) {
				migrations.push(...module.default.filter(this.isMigration));
			}
		}

		// Check for "migration" or "migrations" exports
		if (this.isMigration(module.migration)) {
			migrations.push(module.migration);
		}

		if (Array.isArray(module.migrations)) {
			migrations.push(...module.migrations.filter(this.isMigration));
		}

		// Check all named exports
		for (const [key, value] of Object.entries(module)) {
			if (key !== 'default' && key !== 'migration' && key !== 'migrations') {
				if (this.isMigration(value)) {
					migrations.push(value as Migration<TContext>);
				}
			}
		}

		return migrations;
	}

	/**
	 * Type guard to check if an object is a valid migration
	 */
	private isMigration(obj: unknown): obj is Migration<TContext> {
		if (!obj || typeof obj !== 'object') return false;

		const migration = obj as Partial<Migration<TContext>>;

		return (
			typeof migration.name === 'string' &&
			typeof migration.description === 'string' &&
			typeof migration.isCompleted === 'function' &&
			typeof migration.isFailing === 'function' &&
			typeof migration.hasFailed === 'function' &&
			typeof migration.markComplete === 'function' &&
			typeof migration.markFailed === 'function' &&
			typeof migration.up === 'function'
		);
	}
}
