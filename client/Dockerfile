# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
ENV PNPM_HOME=/pnpm \
	PATH=/pnpm:$PATH \
	COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# Vite bakes env vars into the bundle at build time
ARG VITE_BASE_URL
ENV VITE_BASE_URL=${VITE_BASE_URL}
RUN pnpm build

# unprivileged nginx (runs as non-root on port 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1
