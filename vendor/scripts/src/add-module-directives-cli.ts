#!/usr/bin/env node

import { getErrorMessage } from '@md-oss/common/errors';
import { runAddModuleDirectivesCli } from './add-module-directives';

runAddModuleDirectivesCli().catch((error: unknown) => {
	console.error(getErrorMessage(error));
	process.exitCode = 1;
});
