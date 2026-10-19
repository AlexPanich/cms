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
pnpm install
docker compose up -d db   # только PostgreSQL
pnpm db:migrate
pnpm dev                  # http://localhost:3000
```

Проверки: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check`.

Изменили схему в `src/db/schema.ts`, значит нужно выполнить `pnpm db:generate`, затем `pnpm db:migrate`.

## Полный стек в Docker

```bash
docker compose up --build
```

Поднимаются три сервиса: `db`, `migrate` (применяет миграции и завершается) и `app` на порту `APP_PORT` (по умолчанию 3000). Загруженные файлы хранятся в томе `storage`. Состояние сервиса отдаёт `GET /api/health`.
