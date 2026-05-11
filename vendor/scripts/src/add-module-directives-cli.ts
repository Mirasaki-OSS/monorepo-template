#!/usr/bin/env node

import { runAddModuleDirectivesCli } from './add-module-directives';
import { getErrorMessage } from './helpers';

runAddModuleDirectivesCli().catch((error: unknown) => {
	console.error(getErrorMessage(error));
	process.exitCode = 1;
});
