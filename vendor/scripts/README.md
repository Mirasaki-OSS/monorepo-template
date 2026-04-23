# @md-oss/scripts

Reusable package scripts for monorepo maintenance tasks.

## Included Scripts

- ./find-dependency-mismatches
- ./add-module-directives

## find-dependency-mismatches

This script scans workspace package.json files and reports dependency version mismatches across:

- dependencies
- devDependencies
- peerDependencies
- optionalDependencies

### CLI usage

```bash
pnpm exec md-oss-find-dependency-mismatches
```

Optional flags:

- `--cwd <path>`: run against a specific workspace root.

### Programmatic usage

```typescript
import { findDependencyMismatches } from '@md-oss/scripts/find-dependency-mismatches';

const mismatches = findDependencyMismatches();

if (mismatches.size > 0) {
	console.debug(mismatches);
}
```

It expects a pnpm-workspace.yaml file at the repository root.

## add-module-directives

Adds a module-level directive (for example, `use client` or `use server`) to one or more built files.

### CLI usage

The directive is required and must be explicit.

```bash
pnpm exec md-oss-add-module-directives --directive='use client' dist/next-client.mjs dist/next-client.cjs
```

Optional flags:

- `--cwd <path>`: resolve file paths from a specific directory.
- `--directive <value>`: required module directive to prepend.

### Programmatic usage

```typescript
import { addModuleDirectivesToFiles } from '@md-oss/scripts/add-module-directives';

await addModuleDirectivesToFiles({
	directive: 'use client',
	files: ['dist/next-client.mjs', 'dist/next-client.cjs'],
});
```

