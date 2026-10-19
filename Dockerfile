# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Образ для одноразового запуска миграций и сида (нужны tsx и drizzle-orm из devDependencies).
# Здесь же запускается создание администратора: docker compose run --rm migrate pnpm user:create-admin
FROM deps AS migrator
COPY tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle
CMD ["sh", "-c", "pnpm exec tsx src/db/migrate.ts && pnpm exec tsx src/db/seed.ts"]

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Своих файлов в public пока нет (иконка — в src/app), а git пустой каталог не хранит:
# создаём его, чтобы COPY в runner не падал.
RUN mkdir -p public && pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/storage
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
    && mkdir -p /app/storage && chown nextjs:nodejs /app/storage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
