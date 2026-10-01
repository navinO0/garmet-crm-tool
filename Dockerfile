# ==============================================================================
# Multi-Stage Dockerfile for Garment Production System (Next.js 16 + Turbopack)
# ==============================================================================

# 1. Base Stage: Alpine Linux with essential runtime libraries
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl dumb-init
WORKDIR /app

# 2. Dependencies Stage: Install production and development dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

# 3. Builder Stage: Generate Prisma client and compile Next.js standalone app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client engines
RUN npx prisma generate

# Build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/build_db"
ENV AUTH_SECRET="build-auth-secret-12345678901234567890123456789012"

# Build Next.js standalone distribution
RUN npm run build

# 4. Runner Stage: Ultra-lean non-root production container
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=384"

# Create non-root system user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set up prerender cache directory permissions
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

# Copy static assets and standalone server bundle
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy runtime Prisma client engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy startup entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/login || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]

