# Monorepo

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

A modern TypeScript pnpm turbo monorepo.

## Project Structure

```
.
├── apps/
│   └── cli/          # Example CLI application
├── packages/
│   ├── config/       # Shared TypeScript configuration
│   └── utils/        # Shared utility functions
├── package.json      # Root workspace configuration
├── pnpm-workspace.yaml
├── turbo.json        # Turbo build system configuration
└── tsconfig.json     # Base TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+

### Installation

```bash
pnpm install
```

### Development

Run all development servers:

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

- **@repo/cli** - CLI application example

### Libraries

- **@repo/config** - Shared TypeScript configuration
- **@repo/utils** - Shared utility functions

## Features

- **TypeScript**: Strict mode configuration with proper path aliases
- **Turbo**: Optimized monorepo build orchestration with caching
- **pnpm**: Efficient package management with workspace support
- **Docker**: Production-ready containerization with multi-stage builds
- **Minimal**: Clean structure focused on essentials

## License

[ISC](./LICENSE)
