# CLAUDE.md

CMS на Next.js 16 + TypeScript + PostgreSQL. Переписываем со старой версии на Laravel 5.2 (лежит в `legacy/`).
Данные и URL из старой версии **не переносятся**: база новая, страницы и дизайн тоже новые.

Тема (дизайн сайта) и, в репозитории клиента, правила клиента: @src/theme/CLAUDE.md
Репозиторий клиента создаётся из этого и получает ядро слиянием тегов — `docs/CLIENT.md`.

## Команды

```bash
docker compose up -d db   # только PostgreSQL для локальной разработки
pnpm dev                  # dev-сервер
pnpm db:generate          # SQL-миграция из изменений src/db/schema/
pnpm db:migrate           # применить миграции
pnpm db:seed              # системные роли и меню (идемпотентно)
pnpm user:create-admin --email admin@example.com   # первый администратор из консоли (или /setup в браузере)
pnpm blocks:catalog        # docs/BLOCKS.md из описаний блоков (CI проверяет через --check)
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check   # быстрые проверки CI
pnpm build && pnpm test:e2e   # E2E на Playwright (поднимает pnpm start сам)
pnpm theme:screenshots     # после pnpm build: скриншоты блоков /_blocks и страниц в test-results/screenshots
pnpm build
docker compose up --build # полный стек: db → migrate → app
docker compose -f docker-compose.prod.yml up -d --build   # продакшен: + Caddy (HTTPS) и резервные копии
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
- `src/lib/`: общий код без зависимостей от сервера: права и `can()` (`permissions.ts`), `slugify`, длина пароля, `safeRedirectPath`, `isSafeLinkUrl` (проверка href по белому списку протоколов), клиент Better Auth (`auth-client.ts`).
- `src/server/auth/`: Better Auth (`auth.ts`, `getAuth()`), права пользователя из БД, `getCurrentUser`/`requirePermission`/`requirePagePermission`. Обработчик — `src/app/api/auth/[...all]/route.ts`.
- `src/scripts/`: CLI-скрипты, запускаются через `tsx --conditions=react-server` (иначе падает импорт `server-only`).
- Продакшен — `docker-compose.prod.yml` (проект `cms-prod`): Caddy (`docker/Caddyfile`) — единственный вход снаружи, он же ставит `X-Forwarded-For`, по которому Better Auth считает попытки входа. Порт `app` наружу не открывать. Резервные копии — `docker/backup.sh` в сервисе `backup`. Экземпляр приложения один: кеш и rate limit в памяти.
- Демо на Render (бесплатный план) — `render.yaml` и `docker/render.Dockerfile`: миграции и сид при старте контейнера, файлы эфемерные, база живёт 30 дней. Не продакшен. MCP Render для Claude Code — `.mcp.json`, ключ в `RENDER_API_KEY`.
- `src/db/migrate.ts`: программный мигратор. В Docker его запускает отдельный сервис `migrate` (стадия `migrator` в Dockerfile).
- Route handlers и страницы, которые ходят в БД, должны вызывать `await connection()` из `next/server`. Иначе при `cacheComponents` Next попытается пререндерить их на сборке.
- В запросе к одной таблице Drizzle пишет колонки без имени таблицы, поэтому в коррелированном подзапросе через `sql\`\`` внешнюю колонку нужно писать явно (`media.id`), иначе она свяжется с таблицей подзапроса.
- Тесты лежат рядом с кодом: `src/**/*.test.ts` (Vitest). Алиас `@/*` указывает на `src/*`.
- Интеграционные тесты ходят в отдельную базу на том же Postgres: `TEST_DATABASE_URL` или база из `DATABASE_URL` с суффиксом `_test` (`src/test/database-url.ts`, имя без `_test` отклоняется). Перед прогоном `src/test/global-setup.ts` создаёт её, если нет, и применяет миграции и сид — нужен только запущенный Postgres. Базу разработки тесты не трогают. Каждый тест оборачивается в `withRollback` из `src/test/db.ts` и ничего не оставляет в БД.
- Миграции и сид — функции `migrateDatabase` и `seedDatabase` (`src/db/migrator.ts`, `src/db/seeder.ts`); `src/db/migrate.ts` и `src/db/seed.ts` — их CLI, на эти пути завязаны Dockerfile и Render.

## Админка

- Server action — тонкая обёртка в `src/app/admin/<раздел>/actions.ts`: `return runAction("edit_x", (actor) => service(db(), ...))`. `runAction` (`src/server/action.ts`) проверяет право и превращает `AuthError`, `ZodError` и `DomainError` в `ActionResult`; ошибки возвращаются значением, а не исключением.
- id из аргументов action проверяется zod-схемой в самом action, остальной ввод — схемой сервиса.
- Ошибки предметной области наследуют `DomainError` (`src/server/errors.ts`): `message` показывается пользователю, `field` привязывает ошибку к полю формы.
- Формы: react-hook-form + `zodResolver` с той же схемой, что у сервиса (`src/server/<модуль>/schema.ts` — без серверных зависимостей), поля из `src/components/admin/form-fields.tsx`, отправка через `useActionSubmit`.
- Удаление и другие необратимые действия — через `ConfirmAction` с `action.bind(null, id)`.
- Списки — серверные таблицы с `?q=&page=` (`parsePage`, `parseSearch`, `likePattern` из `src/lib/pagination.ts`).
- Компоненты shadcn — на Base UI: вместо `asChild` проп `render`, ссылка-кнопка — `ButtonLink`. Добавлять компоненты через `pnpm dlx shadcn@latest add <name>`.
- Next 16 с `cacheComponents` не размонтирует посещённые страницы, а прячет их в React `<Activity>`: состояние форм сохраняется между визитами, и скрытая копия остаётся в DOM. Формы создания после успеха делают `form.reset()`; форма, зависящая от `searchParams`, получает `key` по этому параметру.
- Порядок перетаскиванием — dnd-kit по образцу `pages/_components/page-tree.tsx` (оптимистичное обновление, откат при ошибке, объявления на русском); сервис принимает полный список id в новом порядке и проверяет, что это перестановка.
- Блоки страницы — `BlocksEditor` (`src/components/admin/blocks/`): форма блока строится по его полям (`BlockFields`), данные для полей (галереи, страницы для ссылок, адреса картинок, загрузка) даёт `BlockEditorProvider`. Те же поля — в диалоге правки блока на сайте. Блоки из БД — в форму через `blocksFormValue` (`src/lib/blocks/form.ts`). Новый вид поля в DSL требует ввод в `block-fields.tsx`, пустое значение в `form.ts`, а если он ссылается на данные — сборщик id в `registry.ts`, загрузку в `loadBlocksContext` и `resolve…` для темы. Превью блока в каталоге — `BLOCK_PREVIEWS` темы (`src/theme/blocks/previews.ts`).
- Rich text — `FormRichText` (TipTap, `src/components/admin/rich-text-editor.tsx`). Документ хранится как JSON и проверяется `richTextDocSchema` (`src/lib/rich-text.ts`).
- Загрузка картинки — поле `FormImageUpload` (`src/components/admin/image-upload.tsx`) и server action, который вызывает `saveUploadedImage` (`src/server/media/service.ts`). Файл не доверяем ни по имени, ни по MIME: формат определяет sharp, сохраняется перекодированный WebP. Адрес файла — `mediaUrl(storageKey)`, в разметке — `next/image`.
- Картинка используется, если на неё ссылается галерея, превью статьи или блок страницы — подсчёт `galleryUses`/`articleUses`/`pageUses` (таблица `page_media`) в `src/server/media/service.ts`. Новую ссылку на `media` добавляй туда же, иначе картинку сочтут неиспользуемой и удалят вместе с галереей. Записи `media` удаляются в транзакции, а файлы — после неё (`deleteStoredFiles`).
- Документ — запись `media` с `kind = document` (`src/server/documents/`): расширение из белого списка `DOCUMENT_EXTENSIONS`, содержимое сверяется с сигнатурой (`detect.ts`), отдаётся только как вложение. Новый формат добавляется и в список, и в `DOCUMENT_TYPES`.
- Шаблоны страниц объявляет тема: `PAGE_TEMPLATES` в `src/theme/page-templates.ts` (без зависимостей — его импортирует форма), помощники — `src/lib/templates.ts`. Неизвестный ключ из БД — `resolvePageTemplate` → `default`.
- Новый раздел добавляется в `ADMIN_NAV` (`src/app/admin/_components/nav.ts`) с его правом.
- В E2E искать элементы через `getByRole` (скрытые копии из `<Activity>` он пропускает, `getByLabel` — нет), а после `goto`/`reload` дожидаться содержимого: админка сначала отдаёт «Загрузка…» из `<Suspense>`.
- E2E лежат в `e2e/`: всё, что создают тесты, помечается префиксом `e2e-` и удаляется в teardown. Сессия администратора общая (`e2e/.auth/admin.json`), потому что вход ограничен 3 попытками за 10 секунд.

## Публичный сайт

- Маршруты — в `src/app/(site)/`, данные — `src/server/site/service.ts` (только опубликованное).
- Разметка и оформление — тема в `src/theme/` (импорт `@/theme`), контракт `ThemeModule` — `src/components/site/theme.ts`. Маршрут загружает данные, ставит метаданные и JSON-LD и передаёт данные пропсами в компонент темы; тема в БД не ходит. Общие компоненты для тем — `src/components/site/` (`Editable…`, `RichText`). Новый вид страницы — новое поле в `ThemeModule`. Токены темы — в `src/theme/theme.css` только под `[data-site]`, не на `:root`: иначе тема перекрасит админку.
- Публичные страницы рендерятся без стриминга ради SEO: в `(site)` не используй `<Suspense>` и `loading.tsx`, у новых страниц — `export const instant = false`. Иначе текст уйдёт в скрытый блок, а метаданные — из `<head>`.
- Статус 404/308 рендер с Cache Components поставить не может (всегда 200) — его ставит `src/proxy.ts` через `resolveSiteRoute` до рендера. Новый тип публичного адреса добавляй в `classifySitePath` (`src/lib/site-routes.ts`) и `resolveSiteRoute`. «Не найдена» страница рисует сама (`theme.NotFound`), а не через `notFound()` — так сохраняются её метаданные.
- Метаданные публичных страниц — только через `siteMetadata` (`(site)/_lib/metadata.ts`): canonical, Open Graph, noindex. Структурированные данные — `JsonLd` (`src/components/site/json-ld.tsx`). Обёртки с `cache` из React для повторных запросов в одном рендере — `(site)/_lib/data.ts`.
- Новый раздел первого уровня (как `/articles`) добавляй и в `RESERVED_ROOT_SLUGS` (`src/lib/slug.ts`), иначе страница с таким slug станет недоступной.
- Вторая тема `e2e/theme/` проверяет, что ядро не зависит от темы по умолчанию: `pnpm theme:contract` (в CI — задача `theme-contract`) подставляет её на место `src/theme/`. Новое требование к теме (поле `ThemeModule`, блок ядра, вид поля) поддержи и в ней. Тесты ядра (и unit, и E2E) не завязывай на тему по умолчанию: варианты, шаблоны и настройки бери из реестра, а не из подписей темы; не проверяй классы, разделители и уровни заголовков, которые выбирает тема.
- Новый шаблон: ключ в `PAGE_TEMPLATES` темы (`src/theme/page-templates.ts`) и лейаут в `src/theme/templates.tsx`. Ключ `default` обязателен, без него не соберётся.
- Каталог для дизайнера: у `defineBlock` обязательный `example` (картинки и прочие ссылки — из `src/lib/blocks/examples.ts`), по нему рисуется `/_blocks` (`src/app/(catalog)/%5Fblocks`, данные-заглушки — `src/server/site/catalog.ts`). После изменения блоков, полей или вариантов — `pnpm blocks:catalog` и коммит `docs/BLOCKS.md`. Правила для макета — `docs/DESIGN-GUIDE.md`.
- Блоки: поля и тип блока — `field.*` и `defineBlock` (`src/lib/blocks/define.ts`), каталог ядра — `catalog.ts`, свои блоки и варианты темы — `src/theme/blocks/index.ts`. Схему блока меняй только совместимо: новое поле необязательное или со значением по умолчанию, поля не переименовываются. Новый тип блока требует вид в `src/theme/blocks/views.tsx` (`BlockViews`). Данные полей блока на сайте (картинки, документы, галереи, ссылки, последние статьи) приходят в `context`, тема выводит их через `resolveImage`/`resolveDocument`/`resolveLink` из `src/components/site/blocks.tsx`. Блоки страницы пишет только сервис страниц: вместе с ними он обновляет `search_text` и `page_media`. Чтение из БД — через `parseStoredBlocks`/`validStoredBlocks`, данные для ссылок и виджетов — `loadBlocksContext`.
- Новый виджет в контенте: узел TipTap в редакторе (по образцу `src/components/admin/gallery-node.tsx`), вывод в реестре `NODES` (`src/components/site/rich-text.tsx`), загрузка данных в `loadContentContext` (`src/server/site/content.ts`). Документ — это данные: узлы не из реестра не выводятся.
- Тексты лейаута — `SITE_TEXTS` (`src/lib/site.ts`), их создаёт сид.
- Настройки сайта (логотип, контакты, соцсети) — поля DSL блоков: ядро — `CORE_SETTINGS` (`src/lib/site-settings.ts`), тема — `THEME_SETTINGS` (`src/theme/settings.ts`). Одна запись `site_settings`, сервис `src/server/settings/` принимает часть настроек и сливает с сохранёнными. В теме — `context.settings` (лейаут получает `context`), правка на сайте — `EditableSettings fields={…}`. Картинки из настроек считаются в `settings_media`.
- Данные для публичных страниц читаются только через `src/server/site/cached.ts` (`"use cache"` + `cacheTag` по типу данных). Кеш сбрасывает `runAction` по `SITE_CACHE_TAGS_BY_PERMISSION` (`src/lib/site-cache.ts`): новый тип данных — новый тег и строка в этой карте. Чтение по пути или slug — только для адресов из `cachedRouteIndex`, иначе любой запрос на несуществующий адрес станет записью в кеше.
- Правка на сайте: белый список полей — `frontEditInputSchema` (`src/server/front-edit/schema.ts`), новое поле добавляется туда и в сервис. На странице — серверные обёртки из `src/components/site/editable.tsx`, тема оборачивает ими поля в разметке: редактор выводится только пользователю с `edit_from_front`. Вид блока оборачивается в `EditableBlock` — форма блока в диалоге.
- Тяжёлый клиентский код, нужный не всем посетителям, подключай через `next/dynamic` (как `front-edit-lazy.tsx`): Next грузит на каждую страницу все клиентские модули, импортированные в сегменте, даже если они не отрендерены.
- Правки в БД в обход админки (SQL, E2E-фикстуры) сайт не увидит до сброса кеша: `POST /api/site-cache`, в E2E — `resetSiteCache(page)`. Блоки страницы, записанные SQL, не попадут в поиск, если не задать `search_text`.

## Правила

- Любой ввод (формы, server actions, query-параметры) валидируется zod-схемой. zod импортируется только из `@/lib/zod` (правило ESLint): там русские сообщения об ошибках для сервера и форм.
- Изменение данных только через server actions или POST. GET-запросы ничего не меняют.
- Каждое действие в админке проверяет конкретное право (`edit_pages` и т. п.), а не только факт входа:
  страница — `await requirePagePermission("edit_pages", "/admin/pages")`, server action и route handler — `await requirePermission(...)` первой строкой.
  Проверка в `admin/layout.tsx` и `proxy.ts` не защищает: layout не перерисовывается при переходах, а proxy смотрит только на наличие cookie.
- Первый запуск: пока в `users` нет ни одной строки, `/login` ведёт на `/setup`, где создаётся администратор (`createFirstAdmin`, `src/server/setup/`: advisory lock и проверка в транзакции). Это единственное действие без права, его ошибки в `ActionResult` превращает `actionFailure` из `src/server/action.ts`.
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
- От типа коммита зависит версия: release-please (`.github/workflows/release-please.yml`) по `feat:`, `fix:` и `!` в `master` ведёт release-PR, `CHANGELOG.md` и теги `vX.Y.Z`. `CHANGELOG.md` и версию в `package.json` руками не правь.
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
4. ✅ Админка (shadcn/ui, TanStack Table, dnd-kit, TipTap). Порядок: пользователи и роли → страницы → меню → тексты → статьи → галереи → документы.
5. ✅ Публичный сайт: `app/[[...slug]]`, шаблоны как React-лейауты, поиск через Postgres FTS, `sitemap.xml`.
6. ✅ Редактирование на сайте: клиентский компонент для пользователей с правом `edit_from_front`, поля только из белого списка.
7. ✅ E2E-тесты (Playwright) и деплой в Docker.
8. ✅ Темы и блоки: дизайн клиента в `src/theme/`, страница из блоков каталога, каталог для дизайнера, отдельный репозиторий на клиента (`docs/CLIENT.md`, skill `apply-design`).

## Особенности окружения

- На машине разработчика порт 5432 занят другим проектом, поэтому в локальном `.env` стоит `POSTGRES_PORT=5433`.
- Docker работает через OrbStack. Исходящий HTTPS из контейнеров может не работать из-за VPN в режиме fake-IP, и тогда `docker compose up --build` падает на `pnpm install`. Это проблема окружения, а не проекта.
