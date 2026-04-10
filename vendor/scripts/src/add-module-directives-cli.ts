#!/usr/bin/env node

import { runAddModuleDirectivesCli } from './add-module-directives';

runAddModuleDirectivesCli().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exitCode = 1;
});
