# Monorepo

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

A modern TypeScript pnpm turbo monorepo.

## Project Structure

```
.
├── apps/              # Template example applications
│   └── cli/           # Example CLI application
├── packages/          # Template example packages
│   ├── config/        # Shared TypeScript configuration
│   └── utils/         # Shared utility functions
├── vendor/            # Open-source projects (not included in template)
├── package.json       # Root workspace configuration
├── pnpm-workspace.yaml
├── turbo.json         # Turbo build system configuration
└── tsconfig.json      # Base TypeScript configuration
```

> **Template Usage:** When you fork this repository, or click "Use this template" on GitHub, a workflow automatically runs to remove non-template files (primarily the `vendor/` directory) and personalize the repository. The process happens automatically via GitHub Actions on your first commit.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+

### Installation

```bash
pnpm install
```

### Development

Run all development apps:

```bash
pnpm dev
```

Run a specific package:

```bash
cd apps/cli
pnpm dev
```

### Building

Build all packages:

```bash
pnpm build
```

Build a specific package:

```bash
cd packages/utils
pnpm build
```

### Linting & Formatting

```bash
pnpm lint
pnpm format
```

### Testing

```bash
pnpm test
```

## Generating New Packages

Create new apps and packages using Turbo generators:

```bash
# Generate a new application
pnpm gen:app

# Generate a new package
pnpm gen:package
```

The generators use templates from `turbo/generators/` and will prompt you for configuration.

## Shared TypeScript Configuration

This monorepo uses a centralized TypeScript configuration pattern via `@md-oss/config`. Instead of maintaining individual `tsconfig.json` files, packages extend from shared base configurations:

```jsonc
// packages/your-package/tsconfig.json
{
  "extends": "@md-oss/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**Benefits:**
- Consistent compiler settings across all packages
- Update TypeScript config in one place
- Automatically applied to new packages via generators
- Multiple configs available for different use cases (base, node, tsx)

See [`vendor/config/`](./vendor/config/) for available configurations.

## Docker Deployment

Deploy with Docker Compose:

```bash
# Production
pnpm docker:build
pnpm docker:up

# Development with hot reload
pnpm docker:dev
```

See the [docker instructions](./docker/README.md) for detailed Docker setup and configuration.

## Workspace Packages

### Apps

- **@md-oss/cli** - CLI application example

### Libraries

- **@md-oss/config** - Shared TypeScript configuration (base, node, tsx) used by all packages
- **@md-oss/utils** - Shared utility functions

## Features

- **TypeScript**: Strict mode configuration with proper path aliases
- **Turbo**: Optimized monorepo build orchestration with caching
- **pnpm**: Efficient package management with workspace support
- **Docker**: Production-ready containerization with multi-stage builds
- **Minimal**: Clean structure focused on essentials

## License

[ISC](./LICENSE)
