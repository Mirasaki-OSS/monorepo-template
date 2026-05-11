#!/usr/bin/env node

import { runFindDependencyMismatchesCli } from './find-dependency-mismatches';
import { getErrorMessage } from './helpers';

try {
	runFindDependencyMismatchesCli();
} catch (error: unknown) {
	console.error(getErrorMessage(error));
	process.exitCode = 1;
}
