# ===== DEPENDENCIES STAGE =====
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock* ./

# Install all dependencies (including dev dependencies for build)
RUN bun install --frozen-lockfile

# ===== BUILDER STAGE =====
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./

# Copy source code (excluding unnecessary files via .dockerignore)
COPY app ./app
COPY components ./components
COPY contexts ./contexts
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY components.json ./

# Build application with optimizations
RUN NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 bun run build

# ===== PRODUCTION STAGE =====
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Install runtime dependencies and security updates
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && apk upgrade --no-cache \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# No environment variables - all hardcoded for consistency

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Add health check using one of your API endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/api/login || exit 1

# Start application with hardcoded settings
CMD ["sh", "-c", "NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 node server.js"]
