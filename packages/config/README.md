# @md-oss/config

Shared TypeScript configuration for the monorepo.

## Usage

Extend this configuration in package `tsconfig.json`:

```json
{
  "extends": "@md-oss/config/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```
