# Docker Deployment Guide

Docker Compose setup for the pnpm monorepo.

## Features

- **Multi-stage builds** for optimized image sizes
- **Lockfile-only deps layer** for maximum cache reuse across builds
- **Dynamic source resolution** — builder stages copy only the workspace packages each app needs
- **Production-ready** non-root user configuration
- **Development mode** with hot reload support
- **BuildKit** syntax for better performance
- **Security** best practices (non-root user, minimal attack surface)

## Quick Start

### Production

```bash
# Build Docker images
pnpm docker:build

# Start services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

### Development

```bash
pnpm docker:dev
```

Starts the development container with volume mounts for live code updates and hot reload.

```bash
pnpm docker:debug
```

Runs the context-debug profile to generate a build context report in `docker/context-report/`.

## Docker Commands

| Command | Description |
|---------|-------------|
| `pnpm docker:build` | Build all production images |
| `pnpm docker:up` | Start services in detached mode |
| `pnpm docker:down` | Stop and remove containers |
| `pnpm docker:logs` | Follow container logs |
| `pnpm docker:dev` | Start development environment with hot reload |
| `pnpm docker:debug` | Generate build context report |
| `pnpm docker:clean` | Remove containers, volumes, and local images |

## File Layout

```
docker/
  apps/
    cli.Dockerfile      # CLI app
    server.Dockerfile   # Hono/Express API server
    web.Dockerfile      # Next.js standalone app
  compose/
    compose.prod.yaml      # Production services
    compose.dev.yaml       # Development + debug profiles
    compose.postgres.yaml  # Shared postgres service + network
  scripts/bash/docker/
    copy-workspace-manifests.sh  # Copies all */package.json for the deps stage
    copy-app-sources.js          # Copies only the transitive workspace sources for each app
  Dockerfile.dev        # Development image
  Dockerfile.debug      # Build context inspection image
```

## Architecture

### Production build stages (per app)

1. **Base** — Node.js + pnpm setup
2. **Deps** — Copies all workspace `package.json` manifests only, then runs `pnpm fetch` scoped to the app's dependency graph. Tarballs are written to the BuildKit pnpm store cache so subsequent builds are fast even when the store is cold.
3. **Builder** — Copies root config files and uses `copy-app-sources.js` to dynamically resolve and copy only the workspace packages the app transitively depends on via `workspace:` protocol. Installs from the shared pnpm cache (`--prefer-offline`) and builds.
4. **Runner** — Minimal final image with only the deployed production output.

### Dynamic workspace source resolution

`scripts/bash/docker/copy-app-sources.js` walks `pnpm-workspace.yaml` and each package's `package.json` at build time to determine exactly which workspace packages to copy into the builder stage. Only packages still using the `workspace:` protocol are included — packages whose versions have been replaced with published semver (e.g. after template personalization) are automatically excluded.

This means Dockerfiles **never need updating** when workspace dependencies change.

### Development image

`Dockerfile.dev` installs all workspace packages and mounts the project root as a volume, so code changes are reflected immediately without rebuilding the image.

## Configuration

### Environment Variables

Add app-specific environment variables in `docker/compose/compose.prod.yaml`:

```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL=${DATABASE_URL}
```

Or use an `.env` file at the repo root (or rather build context root, loaded automatically by Compose).

## Adding a New App

1. Create `docker/apps/<name>.Dockerfile` using the existing Dockerfiles as a template — only the `--filter` app name needs changing.
2. Add a service block to `docker/compose/compose.prod.yaml`.
3. If the new app has runtime dependencies on other services (not expressed via `workspace:`), add an entry to `SERVICE_DEPS` in `scripts/node/resolve-preserve-list.mjs`.

## Troubleshooting

### Build fails with permission errors

```bash
sudo usermod -aG docker $USER
```

### Stale cache causing unexpected behavior

```bash
docker builder prune
```

### Development hot reload not working

Ensure the volume mount in `compose.dev.yaml` points to your project root and that your bundler/framework has file-watching enabled.

## Security

- Runs as non-root user (`appuser`, uid 1001)
- Minimal base image (Alpine Linux)
- Only production output in final runner image
- No source files or dev dependencies in runner
- Excludes development files via `.dockerignore`

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Docker image
  run: docker compose build cli

- name: Push to registry
  run: |
    docker tag my_app/cli:latest registry.example.com/my_app/cli:${{ github.sha }}
    docker push registry.example.com/my_app/cli:${{ github.sha }}
```
