# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG APP_BUILD=dev
ARG APP_COMMIT=
ENV APP_BUILD=$APP_BUILD APP_COMMIT=$APP_COMMIT
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
