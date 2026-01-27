# syntax=docker/dockerfile:1

# Base stage with pnpm
ARG NODE_VERSION=24.11.1-alpine
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.28.0+sha512.05df71d1421f21399e053fde567cea34d446fa02c76571441bfc1c7956e98e363088982d940465fd34480d4d90a0668bc12362f8aa88000a64e83d0b0e47be48 --activate
WORKDIR /app

# Dependencies stage - install all dependencies
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY vendor/config/package.json ./vendor/config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY apps/cli/package.json ./apps/cli/package.json

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Builder stage - build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/vendor/config/node_modules ./vendor/config/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=deps /app/apps/cli/node_modules ./apps/cli/node_modules
COPY . .

# Build all packages
RUN pnpm build

# Production dependencies stage
FROM base AS prod-deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY vendor/config/package.json ./vendor/config/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY apps/cli/package.json ./apps/cli/package.json

# Install production dependencies only
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# Runtime stage for CLI
FROM base AS cli-runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production dependencies
COPY --from=prod-deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=prod-deps --chown=appuser:nodejs /app/apps/cli/node_modules ./apps/cli/node_modules

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/vendor/config ./vendor/config
COPY --from=builder --chown=appuser:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=appuser:nodejs /app/packages/utils/package.json ./packages/utils/package.json
COPY --from=builder --chown=appuser:nodejs /app/apps/cli/dist ./apps/cli/dist
COPY --from=builder --chown=appuser:nodejs /app/apps/cli/package.json ./apps/cli/package.json

USER appuser
WORKDIR /app/apps/cli

CMD ["node", "dist/index.js"]
