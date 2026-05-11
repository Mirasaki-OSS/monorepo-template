#!/usr/bin/env node

import { getErrorMessage } from './helpers';
import { runSyncPackageExportsCli } from './sync-package-exports';

runSyncPackageExportsCli(process.argv.slice(2)).catch((error: unknown) => {
	console.error(getErrorMessage(error));
	process.exitCode = 1;
});
