# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG APP_BUILD=dev
ARG APP_COMMIT=
ENV APP_BUILD=$APP_BUILD APP_COMMIT=$APP_COMMIT
RUN pnpm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
