# 1. Base: install dependencies
FROM oven/bun:1 as base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2. Builder: copy source + build
FROM base as builder
WORKDIR /app
COPY . .
RUN bun run build

# 3. Runner: production image
FROM oven/bun:1-slim as runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

# Install only production deps
RUN bun install --frozen-lockfile --production

EXPOSE 3000
CMD ["bun", "run", "start"]
