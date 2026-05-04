# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.11.1-alpine

# =====================================================
# Base image with Node.js and pnpm setup
# =====================================================
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.28.0+sha512.05df71d1421f21399e053fde567cea34d446fa02c76571441bfc1c7956e98e363088982d940465fd34480d4d90a0668bc12362f8aa88000a64e83d0b0e47be48 --activate
WORKDIR /app

# =====================================================
# Lockfile-only fetch layer for fast dependency caching
# =====================================================
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY scripts/bash/docker/copy-workspace-manifests.sh /usr/local/bin/copy-workspace-manifests
RUN chmod +x /usr/local/bin/copy-workspace-manifests
RUN --mount=type=bind,source=.,target=/mnt/workspace,ro \
    /usr/local/bin/copy-workspace-manifests /mnt/workspace /app && \
    pnpm fetch --frozen-lockfile --filter "@md-oss/cli..."

# =====================================================
# Builder: Install dependencies, build, and deploy app
# =====================================================
FROM base AS builder
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* turbo.json tsconfig.json ./
RUN --mount=type=bind,source=.,target=/mnt/workspace,ro \
    node /mnt/workspace/scripts/bash/docker/copy-app-sources.js /mnt/workspace /app @md-oss/cli
COPY --from=deps /pnpm /pnpm
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter "@md-oss/cli..." install --frozen-lockfile --offline
RUN pnpm --filter "@md-oss/cli..." build
RUN pnpm --filter "@md-oss/cli" --prod deploy /prod

# =====================================================
# Runner: Final image with only production dependencies and built app
# =====================================================
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:nodejs /prod ./
USER appuser
WORKDIR /app/apps/cli
CMD ["node", "dist/index.js"]
