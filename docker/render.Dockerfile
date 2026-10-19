# syntax=docker/dockerfile:1

# Демо-стенд на Render (render.yaml). Продакшен собирается из корневого Dockerfile.
# На бесплатном плане Render нет pre-deploy команды и нельзя выбрать стадию сборки,
# поэтому этот образ при старте сам применяет миграции и сид, а затем запускает сервер.
FROM node:24-alpine
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Standalone-сервер не содержит статику и public — кладём их рядом, как в корневом Dockerfile.
# Каталога public в git может не быть (пустой не хранится) — создаём.
RUN mkdir -p public && pnpm build \
    && cp -r public .next/standalone/ \
    && cp -r .next/static .next/standalone/.next/

# STORAGE_DIR — абсолютный путь: server.js переходит в свой каталог (process.chdir).
# Файлы на бесплатном плане пропадают при каждом деплое, рестарте и засыпании сервиса.
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/storage
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
    && mkdir -p /app/storage && chown nextjs:nodejs /app/storage
USER nextjs

# Адрес сайта — публичный адрес сервиса на onrender.com (RENDER_EXTERNAL_URL), если
# BETTER_AUTH_URL не задан явно. Порт — PORT, его задаёт Render.
CMD ["sh", "-c", "export BETTER_AUTH_URL=\"${BETTER_AUTH_URL:-$RENDER_EXTERNAL_URL}\" && node_modules/.bin/tsx src/db/migrate.ts && node_modules/.bin/tsx src/db/seed.ts && exec node .next/standalone/server.js"]
