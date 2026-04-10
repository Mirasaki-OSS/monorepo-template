#!/usr/bin/env node

import { runFindDependencyMismatchesCli } from './find-dependency-mismatches';

try {
	runFindDependencyMismatchesCli();
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exitCode = 1;
}
