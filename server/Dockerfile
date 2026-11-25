# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm \
	PATH=/pnpm:$PATH \
	COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# all deps (needed to build)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# compile TypeScript → dist (templates are copied by tsup onSuccess)
FROM deps AS build
COPY tsconfig.json tsup.config.ts ./
COPY src ./src
RUN pnpm build

# production deps only
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
	PORT=5000
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
	CMD wget -qO- "http://127.0.0.1:${PORT}/api/v1/health" > /dev/null || exit 1
CMD ["node", "dist/server.js"]
