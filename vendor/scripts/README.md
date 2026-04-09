# @md-oss/scripts

Reusable package scripts for monorepo maintenance tasks.

## Included Script

- ./find-dependency-mismatches

This script scans workspace package.json files and reports dependency version mismatches across:

- dependencies
- devDependencies
- peerDependencies
- optionalDependencies

## Usage

```typescript
import '@md-oss/scripts/find-dependency-mismatches';
```

Or run it directly:

```bash
pnpm tsx ./vendor/scripts/src/find-dependency-mismatches.ts
```

It expects a pnpm-workspace.yaml file at the repository root.

