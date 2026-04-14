# @md-oss/config

Shared TypeScript configuration. Provides consistent compiler settings across all packages.

## Available Configurations

- **`tsconfig.base.json`** - Base configuration with strict settings. Extend this for all packages.
- **`tsconfig.isomorphic.json`** - For packages that run in both Node.js and the browser (adds DOM types)
- **`tsconfig.node.json`** - For Node.js-only packages (adds `@types/node`)
- **`tsconfig.tsx.json`** - For React/TSX projects (adds DOM types and JSX support)

## Usage

### For standard packages

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

### For isomorphic packages (Node.js + browser)

```json
{
  "extends": "@md-oss/config/tsconfig.isomorphic.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### For Node.js-specific packages

```json
{
  "extends": "@md-oss/config/tsconfig.node.json",
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

## Benefits

- **Consistency**: All packages use the same compiler settings
- **Maintainability**: Update TypeScript config in one place
- **Best practices**: Configurations follow TypeScript and ecosystem best practices
- **Type safety**: Strict mode enabled by default for better code quality

## Adding to New Packages

When creating packages with turbo generators (`pnpm gen:package`), the base configuration is automatically included.
