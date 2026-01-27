// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Example migration: Add created_at to legacy users
 *
 * This is a template migration to demonstrate the system.
 * Replace with your actual legacy data import logic.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import type { Migration } from '@md-oss/migrations';
import { MigrationProgress } from '@md-oss/migrations';
import {
	checkHasFailed,
	checkIsCompleted,
	checkIsFailing,
	markMigrationComplete,
	markMigrationFailed,
	markMigrationRollback,
} from '../../common';
import type { ApiMigrationContext } from '../../types';

const name = 'import-legacy-data';
const description = 'Import legacy data into the new system';

const gzippedPath = path.resolve(__dirname, './db_2025-12-11.sql.gz');
const SAVE_UNZIPPED_DATA = process.env.NODE_ENV === 'development';

let unzippedCache: Buffer | null = null;

const getUnzippedData = async (): Promise<Buffer> => {
	if (unzippedCache) {
		return unzippedCache;
	}

	const gunzip = createGunzip();
	const chunks: Buffer[] = [];
	const gzippedData = await fs.readFile(gzippedPath);

	await pipeline(Readable.from(gzippedData), gunzip, async function* (source) {
		for await (const chunk of source) {
			chunks.push(chunk);
			yield chunk;
		}
	});

	const unzippedData = Buffer.concat(chunks);

	unzippedCache = unzippedData;
	if (SAVE_UNZIPPED_DATA) {
		const unzippedPath = gzippedPath.replace('.gz', '');
		await fs.writeFile(unzippedPath, unzippedData);
	}
	return unzippedData;
};

export const exampleMigration: Migration<ApiMigrationContext> = {
	name,
	description,
	isCompleted: async (ctx) => checkIsCompleted(ctx, name),
	isFailing: async (ctx) => checkIsFailing(ctx, name),
	hasFailed: async (ctx) => checkHasFailed(ctx, name),
	markComplete: async (ctx, result) =>
		markMigrationComplete(ctx, name, description, result),
	markFailed: async (ctx, error) =>
		markMigrationFailed(ctx, name, description, error),
	markRollback: async (ctx, result) =>
		markMigrationRollback(ctx, name, description, result),

	validate: async (ctx) => {
		if (ctx.dryRun) {
			return { valid: true, warnings: [] };
		}

		const warnings: string[] = [];

		// Validate that the gzipped file exists
		try {
			await fs.access(gzippedPath);
		} catch {
			throw new Error(`Required data file not found: ${gzippedPath}`);
		}

		// Validate that unzipping works
		try {
			const data = await getUnzippedData();
			if (data.length === 0) {
				throw new Error('Unzipped data is empty');
			}
			console.log(`Unzipped data size: ${data.length} bytes`);
		} catch (error) {
			throw new Error(`Failed to unzip data file: ${error}`);
		}

		return {
			valid: true,
			warnings,
		};
	},

	up: async (ctx) => {
		const { logger, dryRun, prisma } = ctx;

		logger.info('Starting example migration...');

		if (dryRun) {
			logger.info('[DRY RUN] Would perform migration logic here');
			return;
		}

		// Example: Get all users and process them
		const users = await prisma.user.findMany();
		const progress = new MigrationProgress(logger, users.length);

		for (const user of users) {
			// Example processing logic
			// await processUser(user);

			console.log(`Processing user ${user.id}`);

			progress.increment();
		}

		progress.complete();
		logger.info('Example migration completed successfully!');
	},

	down: async (ctx) => {
		const { logger, dryRun } = ctx;

		logger.warn('Rolling back example migration...');

		if (dryRun) {
			logger.info('[DRY RUN] Would rollback migration here');
			return;
		}

		// Rollback logic here

		logger.info('Rollback complete');
	},
};
