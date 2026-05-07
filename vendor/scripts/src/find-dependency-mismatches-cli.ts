#!/usr/bin/env node

import { getErrorMessage } from '@md-oss/common/errors';
import { runFindDependencyMismatchesCli } from './find-dependency-mismatches';

try {
	runFindDependencyMismatchesCli();
} catch (error: unknown) {
	console.error(getErrorMessage(error));
	process.exitCode = 1;
}
