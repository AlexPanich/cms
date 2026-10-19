# CLAUDE.md

CMS на Next.js 16 + TypeScript + PostgreSQL. Переписываем со старой версии на Laravel 5.2 (лежит в `legacy/`).
Данные и URL из старой версии **не переносятся**: база новая, страницы и дизайн тоже новые.

## Команды

```bash
docker compose up -d db   # только PostgreSQL для локальной разработки
pnpm dev                  # dev-сервер
pnpm db:generate          # SQL-миграция из изменений src/db/schema/
pnpm db:migrate           # применить миграции
pnpm db:seed              # системные роли и меню (идемпотентно)
pnpm user:create-admin --email admin@example.com   # первый администратор (пароль спросит)
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check   # быстрые проверки CI
pnpm build && pnpm test:e2e   # E2E на Playwright (поднимает pnpm start сам)
pnpm build
docker compose up --build # полный стек: db → migrate → app
```

После изменений прогоняй lint, typecheck и test. Если менялась схема, сначала `pnpm db:generate`, и сгенерированную миграцию в `drizzle/` коммить вместе со схемой. Руками миграции не правь.

## Архитектура

- `src/app/`: App Router. Публичный сайт и админка в одном приложении. В `next.config.ts` включены `cacheComponents` и `output: "standalone"`.
- `src/env.ts`: переменные окружения через zod. Читать только через `env()`, не через `process.env` напрямую. `env()` ленивая, чтобы `next build` работал без БД.
- `src/db/index.ts`: клиент Drizzle (postgres.js) через `db()`, это `server-only`. `casing: "snake_case"`: поля в TS в camelCase, колонки в БД в snake_case.
- `src/db/schema/`: схема по модулям (`pages`, `menus`, `media`, `content`, `users`), всё реэкспортируется из `index.ts`. Ограничения целостности (CHECK, уникальность, FK) живут в БД, а не только в коде.
- `src/db/seed.ts`: идемпотентный сид. `src/db/errors.ts`: распознавание ошибок Postgres (Drizzle кладёт исходную ошибку в `cause`).
- `src/server/<модуль>/`: серверная логика модуля. `schema.ts` — zod-схема ввода, `service.ts` — операции с БД (`server-only`), чистые функции отдельно, чтобы тестировать без БД.
- Сервисы принимают первым аргументом `Executor` (`db()` или транзакцию), сами валидируют ввод через zod и бросают типизированную ошибку модуля (например, `PageError` с `code`).
- `src/lib/`: общий код без зависимостей от сервера: права и `can()` (`permissions.ts`), `slugify`, длина пароля, `safeRedirectPath`, клиент Better Auth (`auth-client.ts`).
- `src/server/auth/`: Better Auth (`auth.ts`, `getAuth()`), права пользователя из БД, `getCurrentUser`/`requirePermission`/`requirePagePermission`. Обработчик — `src/app/api/auth/[...all]/route.ts`.
- `src/scripts/`: CLI-скрипты, запускаются через `tsx --conditions=react-server` (иначе падает импорт `server-only`).
- `src/db/migrate.ts`: программный мигратор. В Docker его запускает отдельный сервис `migrate` (стадия `migrator` в Dockerfile).
- Route handlers и страницы, которые ходят в БД, должны вызывать `await connection()` из `next/server`. Иначе при `cacheComponents` Next попытается пререндерить их на сборке.
- Тесты лежат рядом с кодом: `src/**/*.test.ts` (Vitest). Алиас `@/*` указывает на `src/*`.
- Интеграционные тесты ходят в настоящий Postgres из `.env`, поэтому перед `pnpm test` база должна быть поднята и смигрирована. Каждый тест оборачивается в `withRollback` из `src/test/db.ts` и ничего не оставляет в БД.

## Админка

- Server action — тонкая обёртка в `src/app/admin/<раздел>/actions.ts`: `return runAction("edit_x", (actor) => service(db(), ...))`. `runAction` (`src/server/action.ts`) проверяет право и превращает `AuthError`, `ZodError` и `DomainError` в `ActionResult`; ошибки возвращаются значением, а не исключением.
- id из аргументов action проверяется zod-схемой в самом action, остальной ввод — схемой сервиса.
- Ошибки предметной области наследуют `DomainError` (`src/server/errors.ts`): `message` показывается пользователю, `field` привязывает ошибку к полю формы.
- Формы: react-hook-form + `zodResolver` с той же схемой, что у сервиса (`src/server/<модуль>/schema.ts` — без серверных зависимостей), поля из `src/components/admin/form-fields.tsx`, отправка через `useActionSubmit`.
- Удаление и другие необратимые действия — через `ConfirmAction` с `action.bind(null, id)`.
- Списки — серверные таблицы с `?q=&page=` (`parsePage`, `parseSearch`, `likePattern` из `src/lib/pagination.ts`).
- Компоненты shadcn — на Base UI: вместо `asChild` проп `render`, ссылка-кнопка — `ButtonLink`. Добавлять компоненты через `pnpm dlx shadcn@latest add <name>`.
- Новый раздел добавляется в `ADMIN_NAV` (`src/app/admin/_components/nav.ts`) с его правом.
- E2E лежат в `e2e/`: всё, что создают тесты, помечается префиксом `e2e-` и удаляется в teardown. Сессия администратора общая (`e2e/.auth/admin.json`), потому что вход ограничен 3 попытками за 10 секунд.

## Правила

- Любой ввод (формы, server actions, query-параметры) валидируется zod-схемой.
- Изменение данных только через server actions или POST. GET-запросы ничего не меняют.
- Каждое действие в админке проверяет конкретное право (`edit_pages` и т. п.), а не только факт входа:
  страница — `await requirePagePermission("edit_pages", "/admin/pages")`, server action и route handler — `await requirePermission(...)` первой строкой.
  Проверка в `admin/layout.tsx` и `proxy.ts` не защищает: layout не перерисовывается при переходах, а proxy смотрит только на наличие cookie.
- Текущий пользователь — `getCurrentUser()` из `src/server/auth/session.ts` (кешируется на запрос). Проверка права в UI — `can(user, permission)`.
- Страницы, читающие сессию, `headers()` или `searchParams`, оборачивают динамическую часть в `<Suspense>` — этого требует `cacheComponents`.
- Никаких динамических импортов и создания классов по имени из пользовательских данных. Виджеты в контенте берутся только из явного реестра.
- Загруженные файлы хранятся в `STORAGE_DIR` вне `public/`, расширения проверяются по белому списку, отдаются через обработчик.
- SQL пишется только через Drizzle или шаблон `sql\`\`` с параметрами, никакой конкатенации строк.
- Комментарии, тексты интерфейса и сообщения об ошибках на русском.

## Коммиты

Сообщения коммитов пишутся по [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/):

```
<тип>(<область>): <описание>
```

- Типы: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`.
- Область необязательна. Это модуль, который затронут коммитом: `pages`, `menus`, `media`, `auth`, `admin`, `db`, `docker` и т. п.
- Описание на русском, в повелительном наклонении, со строчной буквы, без точки в конце: `feat(pages): добавить дерево страниц`.
- Несовместимые изменения помечаются `!` после типа или области и строкой `BREAKING CHANGE:` в теле коммита.
- Один коммит — одно логическое изменение. Миграция в `drizzle/` коммитится вместе с изменением схемы.

## Legacy

`legacy/` — только справочник по функциональности, его не запускаем и не правим. Он исключён из ESLint, TS, Prettier и Docker-контекста.
Модули старой CMS: дерево страниц, меню, шаблоны, тексты-блоки (`@text(alias)`), статьи с превью, галереи, документы,
пользователи/роли/права, редактирование прямо на сайте, поиск, виджеты в контенте (`[[--widget/gallery/имя--]]`).
Известные дыры старого кода (не повторять): загрузка `.php` в `public/`, SQL-инъекция в поиске, создание классов по имени
из запроса, неработающие права `edit_*`, удаление через GET.

## План миграции

Полный план с принятыми решениями и деталями по этапам лежит в [`docs/PLAN.md`](docs/PLAN.md). Перед началом этапа читай его. Когда этап готов, отмечай его ✅ и там, и здесь.

1. ✅ Каркас: Next.js, Drizzle, Docker, CI.
2. ✅ Схема БД: страницы-дерево (пересчёт путей в транзакции), меню, `media`, тексты, статьи, пользователи, роли, права.
3. ✅ Вход (Better Auth, регистрация закрыта) и проверка прав `can(user, permission)`.
4. Админка (shadcn/ui, TanStack Table, dnd-kit, TipTap). Порядок: пользователи и роли → страницы → меню → тексты → статьи → галереи → документы.
5. Публичный сайт: `app/[[...slug]]`, шаблоны как React-лейауты, поиск через Postgres FTS, `sitemap.xml`.
6. Редактирование на сайте: клиентский компонент для пользователей с правом `edit_from_front`, поля только из белого списка.
7. E2E-тесты (Playwright) и деплой в Docker.

## Особенности окружения

- На машине разработчика порт 5432 занят другим проектом, поэтому в локальном `.env` стоит `POSTGRES_PORT=5433`.
- Docker работает через OrbStack. Исходящий HTTPS из контейнеров может не работать из-за VPN в режиме fake-IP, и тогда `docker compose up --build` падает на `pnpm install`. Это проблема окружения, а не проекта.
