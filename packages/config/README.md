# @repo/config

Shared TypeScript configuration for the monorepo.

## Usage

Extend this configuration in package `tsconfig.json`:

```json
{
  "extends": "@repo/config/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```
