// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Example migration: Import users from a legacy PostgreSQL database
 *
 * This demonstrates:
 * - Custom context with Prisma
 * - Progress tracking
 * - Validation
 * - Error handling
 * - Rollback support
 * - Dry-run mode
 */

import type { BaseMigrationContext, Migration } from '@md-oss/migrations';
import { MigrationProgress } from '@md-oss/migrations';
import type { PrismaClient } from '@prisma/client';

// Extend base context with your app-specific needs
type MyContext = BaseMigrationContext & {
	prisma: PrismaClient;
};

// Mock functions - replace with your actual implementation
async function connectToLegacyDb() {
	// Connect to legacy database
	return { connected: true };
}

async function fetchLegacyUsers() {
	// Fetch from legacy DB
	return [
		{
			id: 1,
			email: 'user1@example.com',
			full_name: 'User One',
			verified_at: new Date(),
			avatar_url: null,
		},
		{
			id: 2,
			email: 'user2@example.com',
			full_name: 'User Two',
			verified_at: null,
			avatar_url: 'https://...',
		},
	];
}

export const importLegacyUsers: Migration<MyContext> = {
	name: 'import-legacy-users',
	description: 'Import users from legacy PostgreSQL database',

	/**
	 * Check if this migration has already been completed
	 */
	isCompleted: async (ctx) => {
		const record = await ctx.prisma.migration.findUnique({
			where: { name: 'import-legacy-users' },
		});
		return record?.completed === true;
	},

	/**
	 * Check if this migration is currently failing
	 */
	isFailing: async (ctx) => {
		const record = await ctx.prisma.migration.findUnique({
			where: { name: 'import-legacy-users' },
		});
		// Failing if record exists, has error, and is not completed
		return !!record && !!record.error && record.completed === false;
	},

	/**
	 * Check if this migration has failed in a previous attempt
	 */
	hasFailed: async (ctx) => {
		const record = await ctx.prisma.migration.findUnique({
			where: { name: 'import-legacy-users' },
		});
		// Failed if record exists, has error, and is completed
		return !!record && !!record.error && record.completed === true;
	},

	/**
	 * Mark migration as successfully completed
	 */
	markComplete: async (ctx, result) => {
		await ctx.prisma.migration.upsert({
			where: { name: 'import-legacy-users' },
			create: {
				name: 'import-legacy-users',
				description: 'Import users from legacy PostgreSQL database',
				completed: true,
				completedAt: new Date(),
				duration: result.duration,
			},
			update: {
				completed: true,
				completedAt: new Date(),
				duration: result.duration,
				error: null, // Clear any previous errors
			},
		});
	},

	/**
	 * Mark migration as failed
	 */
	markFailed: async (ctx, error) => {
		await ctx.prisma.migration.upsert({
			where: { name: 'import-legacy-users' },
			create: {
				name: 'import-legacy-users',
				description: 'Import users from legacy PostgreSQL database',
				completed: false,
				error: error.message,
				lastAttemptAt: new Date(),
			},
			update: {
				error: error.message,
				lastAttemptAt: new Date(),
			},
		});
	},

	/**
	 * Validate prerequisites before execution
	 */
	validate: async (ctx) => {
		const { logger, dryRun } = ctx;

		// Skip validation in dry-run mode if needed
		if (dryRun) {
			return { valid: true };
		}

		logger.info('Validating prerequisites...');

		// Check if we can connect to legacy database
		const legacyDb = await connectToLegacyDb();
		if (!legacyDb.connected) {
			return {
				valid: false,
				message:
					'Cannot connect to legacy database. Check connection string and credentials.',
			};
		}

		// Check current state
		const existingUsers = await ctx.prisma.user.count();
		const warnings: string[] = [];

		if (existingUsers > 0) {
			warnings.push(
				`Database already contains ${existingUsers} users. Migration will add to existing data.`
			);
		}

		logger.info('Validation passed');
		return {
			valid: true,
			warnings,
		};
	},

	/**
	 * Execute the migration
	 */
	up: async (ctx) => {
		const { logger, dryRun, prisma } = ctx;

		logger.info('Starting legacy user import...');

		// Fetch data from legacy database
		logger.info('Fetching users from legacy database...');
		const legacyUsers = await fetchLegacyUsers();
		logger.info(`Found ${legacyUsers.length} users to import`);

		// In dry-run mode, just preview what would happen
		if (dryRun) {
			logger.info(`[DRY RUN] Would import ${legacyUsers.length} users:`);

			// Show first 5 as preview
			const preview = legacyUsers.slice(0, 5);
			for (const user of preview) {
				logger.info(`  - ${user.email} (${user.full_name})`);
			}

			if (legacyUsers.length > 5) {
				logger.info(`  ... and ${legacyUsers.length - 5} more`);
			}

			return;
		}

		// Track progress for long-running operation
		const progress = new MigrationProgress(logger, legacyUsers.length, 10);

		let imported = 0;
		let skipped = 0;
		const errors: Array<{ user: unknown; error: Error }> = [];

		// Process each user
		for (const legacyUser of legacyUsers) {
			try {
				// Check if user already exists
				const existing = await prisma.user.findUnique({
					where: { email: legacyUser.email },
				});

				if (existing) {
					logger.debug(`Skipping existing user: ${legacyUser.email}`);
					skipped++;
					progress.increment();
					continue;
				}

				// Transform legacy data to new schema
				const transformed = {
					email: legacyUser.email,
					name: legacyUser.full_name,
					emailVerified: legacyUser.verified_at !== null,
					image: legacyUser.avatar_url,
					// Custom field to track migrated users
					migratedFromLegacy: true,
					createdAt: new Date(),
				};

				// Insert into new database
				await prisma.user.create({ data: transformed });
				imported++;
				progress.increment();
			} catch (error) {
				logger.error(`Failed to import user ${legacyUser.email}`, {
					error: error instanceof Error ? error.message : String(error),
				});
				errors.push({
					user: legacyUser,
					error: error instanceof Error ? error : new Error(String(error)),
				});
			}
		}

		progress.complete();

		// Log summary
		logger.info('Import summary:', {
			total: legacyUsers.length,
			imported,
			skipped,
			failed: errors.length,
		});

		// If too many errors, consider the migration failed
		if (errors.length > legacyUsers.length * 0.1) {
			// More than 10% failure rate
			throw new Error(
				`Too many failures: ${errors.length}/${legacyUsers.length} users failed to import`
			);
		}

		if (errors.length > 0) {
			logger.warn(
				`${errors.length} users failed to import (within acceptable threshold)`
			);
		}

		logger.info('Legacy user import completed successfully!');
	},

	/**
	 * Optional: Rollback the migration
	 *
	 * Note: Be VERY careful with rollback operations!
	 * This example only works because we added migratedFromLegacy flag.
	 */
	down: async (ctx) => {
		const { logger, dryRun, prisma } = ctx;

		logger.warn('Rolling back user import...');

		if (dryRun) {
			const count = await prisma.user.count({
				where: { migratedFromLegacy: true },
			});
			logger.info(`[DRY RUN] Would delete ${count} imported users`);
			return;
		}

		// Delete all users imported by this migration
		const result = await prisma.user.deleteMany({
			where: { migratedFromLegacy: true },
		});

		logger.info(`Rollback complete: deleted ${result.count} users`);

		// Also delete the migration record so it can be run again
		await prisma.migration.delete({
			where: { name: 'import-legacy-users' },
		});
	},
};
