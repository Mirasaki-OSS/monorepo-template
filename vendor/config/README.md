# @md-oss/config

Shared TypeScript configuration for the monorepo. Provides consistent compiler settings across all packages.

## Available Configurations

- **`tsconfig.base.json`** - Base configuration for Node.js packages (recommended for most packages)
- **`tsconfig.node.json`** - Strict Node.js environment configuration
- **`tsconfig.tsx.json`** - Configuration for React/TSX projects

## Usage

### For standard packages

Extend the base configuration in your package's `tsconfig.json`:

```json
{
  "extends": "@md-oss/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### For React/Next.js projects

```json
{
  "extends": "@md-oss/config/tsconfig.tsx.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

### For Node.js-specific packages

```json
{
  "extends": "@md-oss/config/tsconfig.node.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

## Benefits

- **Consistency**: All packages use the same compiler settings
- **Maintainability**: Update TypeScript config in one place
- **Best practices**: Configurations follow TypeScript and ecosystem best practices
- **Type safety**: Strict mode enabled by default for better code quality

## Adding to New Packages

When creating packages with turbo generators (`pnpm gen:package`), the base configuration is automatically included.
