# Docker Deployment Guide

Docker Compose setup for the pnpm monorepo.

## Features

- **Multi-stage builds** for optimized image sizes
- **Layer caching** with pnpm store cache
- **Production-ready** non-root user configuration
- **Development mode** with hot reload support
- **BuildKit** syntax for better performance
- **Security** best practices (non-root user, minimal attack surface)

## Quick Start

### Production

Build and run the application:

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

Run with hot reload:

```bash
pnpm docker:dev
```

This starts the development container with:
- Volume mounts for live code updates
- All development dependencies
- Hot reload enabled

## Docker Commands

| Command | Description |
|---------|-------------|
| `pnpm docker:build` | Build Docker images |
| `pnpm docker:up` | Start services in detached mode |
| `pnpm docker:down` | Stop and remove containers |
| `pnpm docker:logs` | Follow container logs |
| `pnpm docker:dev` | Start development environment |
| `pnpm docker:clean` | Remove containers, volumes, and images |

## Architecture

### Production Image

The production Dockerfile uses a multi-stage build:

1. **Base** - Sets up Node.js and pnpm
2. **Deps** - Installs all dependencies (cached)
3. **Builder** - Builds TypeScript code
4. **Prod-deps** - Installs production dependencies only
5. **Runner** - Final minimal runtime image

### Image Sizes

- Production image: ~200MB (optimized)
- Development image: ~500MB (includes dev dependencies)

## Configuration

### Environment Variables

Add environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - API_KEY=${API_KEY}
  - DATABASE_URL=${DATABASE_URL}
```

Or use an `.env` file:

```bash
NODE_ENV=production
API_KEY=your_key_here
```

### Volumes

Uncomment volume mounts in `docker-compose.yml` for persistent data:

```yaml
volumes:
  - ./data:/app/data
```

### Custom Commands

Override the default command:

```yaml
command: ["node", "dist/custom-script.js"]
```

## Adding New Services

To add a new app to the Docker setup:

1. Add the app's package.json to dependency copy in Dockerfile
2. Copy built artifacts in the runner stage
3. Add a new service in docker-compose.yml

Example:

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile
    target: api-runner
  image: my_app/api:latest
  ports:
    - "3000:3000"
  networks:
    - my_app-network
```

## Performance Tips

1. **Use BuildKit**: Enabled by default with `# syntax=docker/dockerfile:1`
2. **Cache dependencies**: Leverages Docker cache layers for faster builds
3. **Parallel builds**: Use `docker compose build --parallel`
4. **Prune regularly**: Run `docker system prune -a` to free space

## Troubleshooting

### Build fails with permission errors

Ensure Docker has proper permissions:
```bash
sudo usermod -aG docker $USER
```

### Cache not working

Clear BuildKit cache:
```bash
docker builder prune
```

### Development hot reload not working

Ensure volume mounts are correct and file watchers are configured.

## Security

- Runs as non-root user (`appuser`)
- Minimal base image (Alpine Linux)
- Only production dependencies in final image
- No unnecessary tools or packages
- Excludes development files via .dockerignore

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Docker image
  run: docker compose build

- name: Push to registry
  run: |
    docker tag my_app/cli:latest registry.example.com/my_app/cli:${{ github.sha }}
    docker push registry.example.com/my_app/cli:${{ github.sha }}
```

## License

Private source-code!
