# @md-oss/cli

Minimal app (cli) **example** for the monorepo-template.

## Table of Contents

- [Overview](#overview)
- [Development](#development)
- [Usage](#usage)
- [Structure](#structure)

## Overview

This app is a small TypeScript CLI built with `tsx` for development and `pkgroll` for production builds. It currently exposes a greeting command with basic `--help` and `--version` handling and serves as the reference structure for future CLI commands.

## Development

```bash
pnpm --filter @md-oss/cli dev
pnpm --filter @md-oss/cli build
pnpm --filter @md-oss/cli start
pnpm --filter @md-oss/cli typecheck
```

## Usage

```bash
pnpm --filter @md-oss/cli dev
```

```bash
pnpm --filter @md-oss/cli start -- Alice
pnpm --filter @md-oss/cli start -- --help
pnpm --filter @md-oss/cli start -- --version
```

The current CLI behavior is:

- greet the provided positional argument, defaulting to `World`
- print usage information for `--help` or `-h`
- print the CLI version for `--version` or `-v`

## Structure

- `src/index.ts` contains argument parsing, help/version output, and the main entrypoint.
- `dist/index.js` is the built executable published through the package `bin` field.
- `@md-oss/utils` provides the greeting helper used by the CLI.
- `@md-oss/common/errors` provides normalized error formatting for command failures.
