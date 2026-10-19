# CMS

Система управления сайтом на Next.js, TypeScript и PostgreSQL. Переписывается со старой версии на Laravel 5.2, которая лежит в `legacy/` только как справочник: данные и URL не переносятся.

## Стек

- Next.js 16 (App Router), React 19, Tailwind CSS 4
- PostgreSQL 17, Drizzle ORM, миграции в `drizzle/`
- zod для проверки входных данных и переменных окружения (`src/env.ts`)
- Vitest, ESLint, Prettier, GitHub Actions

## Разработка

```bash
cp .env.example .env      # если порт 5432 занят, поменяйте POSTGRES_PORT и DATABASE_URL
# в .env впишите BETTER_AUTH_SECRET: openssl rand -base64 32
pnpm install
docker compose up -d db   # только PostgreSQL
pnpm db:migrate && pnpm db:seed
pnpm user:create-admin --email admin@example.com
pnpm dev                  # http://localhost:3000, админка — /admin
```

Проверки: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check`.

Изменили схему в `src/db/schema/`, значит нужно выполнить `pnpm db:generate`, затем `pnpm db:migrate`.

## Полный стек в Docker

```bash
docker compose up --build
```

Нужен `.env` с `BETTER_AUTH_SECRET` (и `BETTER_AUTH_URL`, если сайт открывается не с `http://localhost:3000`). Первый администратор: `docker compose run --rm migrate pnpm user:create-admin --email admin@example.com`.

Поднимаются три сервиса: `db`, `migrate` (применяет миграции и сид, затем завершается) и `app` на порту `APP_PORT` (по умолчанию 3000). Загруженные файлы хранятся в томе `storage`. Состояние сервиса отдаёт `GET /api/health`.
