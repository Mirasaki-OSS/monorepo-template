# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.11.1-alpine

# =====================================================
# Base image with Node.js and pnpm setup
# =====================================================
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Note: git required for fumadocs plugin
RUN apk add --no-cache git && \
    corepack enable && corepack prepare pnpm@10.28.0+sha512.05df71d1421f21399e053fde567cea34d446fa02c76571441bfc1c7956e98e363088982d940465fd34480d4d90a0668bc12362f8aa88000a64e83d0b0e47be48 --activate
WORKDIR /app

# =====================================================
# Lockfile-only fetch layer for fast dependency caching
# =====================================================
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY scripts/bash/deploy/copy-workspace-manifests.sh /usr/local/bin/copy-workspace-manifests
RUN chmod +x /usr/local/bin/copy-workspace-manifests
RUN --mount=type=bind,source=.,target=/mnt/workspace,ro \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    /usr/local/bin/copy-workspace-manifests /mnt/workspace /app && \
    pnpm fetch --frozen-lockfile --filter "@md-oss/web..."

# =====================================================
# Builder: Install dependencies and build standalone app
# Note: All public/client env needs to be present at build
# time for Next.js to inline them into the build output.
# =====================================================
FROM base AS builder
ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* turbo.json tsconfig.json ./
RUN --mount=type=bind,source=.,target=/mnt/workspace,ro \
    node /mnt/workspace/scripts/bash/deploy/copy-app-sources.js /mnt/workspace /app @md-oss/web
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter "@md-oss/web..." install --frozen-lockfile --prefer-offline
RUN pnpm --filter "@md-oss/web..." build

# =====================================================
# Runner: Final image with only standalone output
# =====================================================
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=appuser:nodejs /app/apps/web/public ./apps/web/public

USER appuser
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
