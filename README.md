# Monorepo

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

Heavily opinionated monorepo template for modern web development, built with [Next.js](https://nextjs.org/), [Turborepo](https://turborepo.dev/), and more.

## Features

- [**TypeScript**](https://www.typescriptlang.org/): Strict mode with [shared configuration](./vendor/config)
- [**Turborepo**](https://turborepo.dev/): Optimized monorepo build orchestration with caching
- [**pnpm**](https://pnpm.io/): Efficient package management with workspace support
- [**Docker**](https://www.docker.com/): Production-ready containerization with multi-stage builds
- **Minimal**: Composable, well-scoped package-based architecture with clear layering and boundaries

> [!NOTE]
> This monorepo is focused on a specific set of frameworks/tools. If you prefer to use a different framework, like [TanStack Router](https://tanstack.com/router/latest) over [Next.js](https://nextjs.org/), or [Hono](https://hono.dev/) over [express](https://expressjs.com/) - we recommend generating a monorepo using [Better T Stack](https://www.better-t-stack.dev/new) instead.

## Project Structure

```bash
├── apps/                 # Consumers: The applications implementing vendor/ and packages/
├── deploy                # Docker, and compose, deployment artifacts
├── packages/             # Non-published (local) packages - these are generally recreated/modified for each project
├── vendor/               # Published packages/libraries - optionally included in template repo through preserve-list
│                         # Please note: `./vendor` packages are moved into `./packages` if preserved
├── pnpm-workspace.yaml   # Root workspace configuration
├── turbo.json            # Turbo orchestration configuration
└── tsconfig.json         # TypeScript configuration for `./turbo/generators` and `.ts` scripts in `./scripts/` directory.
```

> [!IMPORTANT]
> After creating a new repository with GitHub's "Use this template" button, you must run the `Prepare Template` workflow manually from the Actions tab before working in the repo. This step removes template-only files, personalizes the repository, and applies your selected package list:
> 
> Open `Actions` -> `Prepare Template` -> `Run workflow`, then choose the apps, packages, and vendor libraries you want to preserve as local workspaces (packages). Anything not preserved will fall back to its current published package version when possible.

<!--
  Note: We cannot include a link to the action here, because the action we want the user to execute is
  exactly the action that modifies repository references in this file - meaning the link would only be updated
  to *their* repository *after* the action (we're trying to link them to) is ran.
-->

<!-- START_REMOVE_WHEN_MATERIALIZING_DOCS -->
## Getting Started

Please head on over to the documentation site to learn how to get started: [`/docs/guides/getting-started`](https://monorepo.mirasaki.dev/docs/guides/getting-started/).

<!-- END_REMOVE_WHEN_MATERIALIZING_DOCS -->
<!-- START_REMOVE_WHEN_MATERIALIZING_DOCS -->
## Workspace Packages

Please see the documentation for a complete list of packages that can be preserved and/or consumed from `npm`: [monorepo.mirasaki.dev](https://monorepo.mirasaki.dev/docs).
<!-- END_REMOVE_WHEN_MATERIALIZING_DOCS -->
## License

This project, and it's published packages, are released under the [ISC License](./LICENSE). It’s a permissive license that gives you broad freedom to use, modify, and redistribute the code — including in proprietary or closed-source projects.
