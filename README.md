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

Проверки: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check`. Тесты работают с отдельной базой `<имя базы>_test` на том же сервере (или `TEST_DATABASE_URL`): она создаётся, мигрируется и засевается сама, база разработки не меняется.

Изменили схему в `src/db/schema/`, значит нужно выполнить `pnpm db:generate`, затем `pnpm db:migrate`.

## Полный стек в Docker

```bash
docker compose up --build
```

Нужен `.env` с `BETTER_AUTH_SECRET` (и `BETTER_AUTH_URL`, если сайт открывается не с `http://localhost:3000`).

Первый администратор: пока в базе нет ни одного пользователя, `/login` и `/admin` ведут на `/setup` — там администратор создаётся в браузере, после этого страница закрывается. Его же можно создать из консоли: `docker compose run --rm migrate pnpm user:create-admin --email admin@example.com`.

Поднимаются три сервиса: `db`, `migrate` (применяет миграции и сид, затем завершается) и `app` на порту `APP_PORT` (по умолчанию 3000). Загруженные файлы хранятся в томе `storage`. Состояние сервиса отдаёт `GET /api/health`.

## Продакшен

Один сервер с Docker: `docker-compose.prod.yml` поднимает `db`, `migrate`, `app`, `caddy` (HTTPS с сертификатом Let's Encrypt) и `backup`. Наружу открыты только порты 80 и 443 у Caddy: база и приложение доступны лишь внутри сети compose.

```bash
cp .env.production.example .env   # заполнить SITE_DOMAIN, POSTGRES_PASSWORD, BETTER_AUTH_SECRET
docker compose -f docker-compose.prod.yml up -d --build
```

Затем сразу откройте `https://<домен>/setup` и создайте администратора: пока его нет, это может сделать любой, кто первым откроет сайт. Либо из консоли сервера до открытия DNS: `docker compose -f docker-compose.prod.yml run --rm migrate pnpm user:create-admin --email admin@example.com`.

DNS-запись домена должна указывать на сервер до первого запуска, иначе Caddy не получит сертификат. Обновление — `git pull` и та же команда `up -d --build`: миграции применятся до старта приложения.

Тома: `db-data` (БД), `storage` (загруженные файлы), `caddy-data` (сертификаты).

### Резервные копии

Сервис `backup` при запуске и затем раз в `BACKUP_INTERVAL_HOURS` часов кладёт в `BACKUP_DIR` (по умолчанию `./backups`) дамп БД `db-<метка>.dump` и архив файлов `storage-<метка>.tar.gz`. Копии старше `BACKUP_KEEP_DAYS` дней удаляются. Каталог лежит на том же сервере — копируйте его наружу (rsync, снапшоты хостинга).

```bash
# копия прямо сейчас
docker compose -f docker-compose.prod.yml exec backup sh /usr/local/bin/backup.sh once

# восстановление: БД и файлы заменяются содержимым копии
docker compose -f docker-compose.prod.yml stop app
docker compose -f docker-compose.prod.yml exec backup sh /usr/local/bin/backup.sh restore 20261019-030000
docker compose -f docker-compose.prod.yml start app
```

Дамп и архив делаются друг за другом, а не одним снимком: файл, загруженный между ними, может оказаться в архиве без записи в БД. Такой файл ни на что не влияет.

### Ограничения

Приложение рассчитано на один экземпляр: кеш публичного сайта и счётчики попыток входа хранятся в памяти процесса. Для нескольких экземпляров нужны общий `cacheHandlers` (например, на Redis) и хранилище rate limit в БД — см. `docs/PLAN.md`, этап 7.

## Демо на Render

Тестовый стенд на бесплатном плане Render описан в `render.yaml` (Blueprint): web service из `docker/render.Dockerfile` и Render Postgres 17, регион `frankfurt`. Деплой — автоматически после зелёного CI на коммите в `master` (`autoDeployTrigger: checksPass`). Продакшен — не здесь, а на своём сервере (раздел «Продакшен»).

Создание: в дашборде Render — New → Blueprint → этот репозиторий. `BETTER_AUTH_SECRET` Render сгенерирует сам, `DATABASE_URL` возьмёт из базы, адрес сайта — из `RENDER_EXTERNAL_URL`.

На бесплатном плане нет pre-deploy команды и нельзя выбрать стадию Dockerfile, поэтому отдельный образ при каждом старте применяет миграции и сид, а затем запускает сервер.

Ограничения бесплатного плана:

- Сервис засыпает через 15 минут без запросов, первый запрос после этого — около минуты.
- Загруженные картинки и документы пропадают при каждом деплое, рестарте и засыпании: постоянного диска нет. Записи о них в БД остаются, а файлы отдают 404.
- Бесплатная база удаляется через 30 дней после создания (плюс 14 дней, чтобы перейти на платный план).
- Прокси Render присылает `X-Forwarded-For` списком адресов, а Better Auth доверяет только заголовку с одним адресом. Поэтому лимит попыток входа общий для всех посетителей (3 за 10 секунд), в логах — предупреждение Better Auth об этом.

Первый администратор — на `/setup` (на него ведёт `/login`, пока пользователей нет). Shell на бесплатном плане нет; из консоли — с локальной машины через внешний адрес базы (Render → база → Connections → External Database URL):

```bash
DATABASE_URL='<External Database URL>?sslmode=require' pnpm user:create-admin --email admin@example.com
```

### Render MCP

`.mcp.json` подключает к Claude Code MCP-сервер Render (деплои, логи, метрики, сервисы). Ключ — в переменной окружения `RENDER_API_KEY` (Render → Account Settings → API Keys), в репозиторий он не попадает. Без переменной Claude Code покажет ошибку подключения этого сервера.

## Сайт для клиента

Каждый клиент — отдельный репозиторий из этого: дизайн в `src/theme/`, ядро приходит слиянием тегов. Как создать репозиторий, натянуть макет, обновить ядро и выкатить — [docs/CLIENT.md](docs/CLIENT.md). Каталог блоков для дизайнера — [docs/BLOCKS.md](docs/BLOCKS.md), правила — [docs/DESIGN-GUIDE.md](docs/DESIGN-GUIDE.md).

## Релизы

Версии ведёт [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release-please.yml`) по коммитам в формате Conventional Commits:

1. После пуша в `master` с коммитами `feat:`, `fix:` или несовместимыми изменениями release-please открывает или обновляет release-PR: версия в `package.json` и `.release-please-manifest.json`, записи в `CHANGELOG.md`.
2. Слияние release-PR создаёт тег `vX.Y.Z` и GitHub Release.

В настройках репозитория должно быть включено Settings → Actions → General → «Allow GitHub Actions to create and approve pull requests». CI на release-PR сам не запускается: PR создаёт бот, и GitHub ждёт одобрения (статус `action_required`). Перед слиянием откройте PR и нажмите «Approve and run workflows».
