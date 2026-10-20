# Changelog

## [1.0.0](https://github.com/AlexPanich/cms/compare/v0.2.0...v1.0.0) (2026-10-19)


### Features

* **auth:** создание первого администратора на /setup ([6369f95](https://github.com/AlexPanich/cms/commit/6369f950e37b3181b7b2fa1694686405be9cefd1))
* **auth:** создание первого администратора на /setup ([ec0a0eb](https://github.com/AlexPanich/cms/commit/ec0a0eb3d8f76f50103d7781155fb5a1f5a55870))
* **blocks:** добавить DSL полей и реестр блоков ([bfac806](https://github.com/AlexPanich/cms/commit/bfac8063667c80a30b83c8a44f0e0bc0acd5a872))
* **blocks:** добавить DSL полей и реестр блоков ([9e5486e](https://github.com/AlexPanich/cms/commit/9e5486e5b58e33af7aff7c784b9e4decdad7cf10))
* **blocks:** добавить базовый каталог блоков ([414219c](https://github.com/AlexPanich/cms/commit/414219cd35492e063aa60d808cbf0fcde2317788))
* **blocks:** добавить базовый каталог блоков ([b605596](https://github.com/AlexPanich/cms/commit/b6055969dbfb05f18e3129bbc9f5fea9d0775522))
* **blocks:** добавить каталог блоков для дизайнера ([89c5a09](https://github.com/AlexPanich/cms/commit/89c5a09628a95ba6ee6dd6eb808e8fc3ffcc766e))
* **blocks:** добавить каталог блоков для дизайнера ([b2ac995](https://github.com/AlexPanich/cms/commit/b2ac9952d95cbb6bcdb802f59ed24d96086d0e15))
* **pages:** добавить редактор блоков страницы ([66d8261](https://github.com/AlexPanich/cms/commit/66d8261bc3d6a1bbb26454b5b7c4a6350758fa5e))
* **pages:** добавить редактор блоков страницы ([c42371b](https://github.com/AlexPanich/cms/commit/c42371be341e0785b01e212002bf13d8a26af179))
* **pages:** собирать страницы из блоков ([049959e](https://github.com/AlexPanich/cms/commit/049959e010c534d3872c69684bc086de480ae33c))
* **pages:** собирать страницы из блоков ([bf0206c](https://github.com/AlexPanich/cms/commit/bf0206c2f1991edfd3068f4ab6a9da9cf42beb9e))
* **settings:** добавить настройки сайта и блок «Контакты» ([8bd95b7](https://github.com/AlexPanich/cms/commit/8bd95b7ce30ca5a3bc6f2c205406c06ad026df66))
* **settings:** добавить настройки сайта и блок «Контакты» ([332574e](https://github.com/AlexPanich/cms/commit/332574e92cc8e7c2324076b571c05ae60a9c052f))


### Bug Fixes

* **theme:** скрывать заголовок страницы над первым экраном ([b2c1fe4](https://github.com/AlexPanich/cms/commit/b2c1fe46f18a8168d9ff673f16c2a5b973a4c278))


### Miscellaneous Chores

* не создавать AGENTS.md при запуске Next ([6a46220](https://github.com/AlexPanich/cms/commit/6a46220966fd8667321e4b82008a10ea659be057))

## [0.2.0](https://github.com/AlexPanich/cms/compare/v0.1.0...v0.2.0) (2026-10-19)


### Features

* **admin:** основа админки на shadcn/ui ([e99bc3d](https://github.com/AlexPanich/cms/commit/e99bc3d314c29c17780c112e0882230ac6dc7d08))
* **articles:** статьи с превью, загрузка изображений через sharp ([4814086](https://github.com/AlexPanich/cms/commit/48140866b86641eb8b796f73a4864bdc09474b4d))
* **auth:** вход через Better Auth и проверка прав ([f1a5aa4](https://github.com/AlexPanich/cms/commit/f1a5aa4cdc0c258f684f25bf7e2645e7968e8b34))
* **db:** схема БД, дерево страниц и сид ([6eee5cb](https://github.com/AlexPanich/cms/commit/6eee5cb5c65abbbd3ad6292b611e46578531f6ab))
* **docker:** продакшен-конфигурация с Caddy и резервными копиями ([0ba2c01](https://github.com/AlexPanich/cms/commit/0ba2c01b0e9bfb3c4e04878894bcec21c8eb94f7))
* **documents:** загрузка документов с проверкой формата и отдачей как вложение ([08bb53e](https://github.com/AlexPanich/cms/commit/08bb53ef6e8b7dc7bfcbce5d4844e198b1378689))
* **galleries:** галереи с множественной загрузкой и сортировкой, медиатека ([f48cf6a](https://github.com/AlexPanich/cms/commit/f48cf6a440b7a98cb01c81c21cb4c9b5080461bd))
* **menus:** пункты меню со ссылками на страницы и сортировкой ([23350bb](https://github.com/AlexPanich/cms/commit/23350bb338eeb1c0fb5a7a2447622a3401d793ce))
* **pages:** дерево страниц, форма с редактором TipTap ([d337171](https://github.com/AlexPanich/cms/commit/d337171fd01220f76177f21b7d4a285d46651802))
* **site:** SEO — рендер без стриминга, настоящие 404 и 308 через proxy, canonical, Open Graph, JSON-LD ([6c49664](https://github.com/AlexPanich/cms/commit/6c496646371a6782d0f3ecfaf51009aa8f3dc8fb))
* **site:** кеш публичных страниц со сбросом после правок в админке ([8299ebd](https://github.com/AlexPanich/cms/commit/8299ebdf7fd5b07e9a1e3864c08229eec7203042))
* **site:** публичный сайт — страницы, шаблоны, статьи, галереи в тексте, поиск, sitemap ([95e3614](https://github.com/AlexPanich/cms/commit/95e3614b214baaacf96561bf62a3d5e12db3f7a9))
* **site:** редактирование на сайте для пользователей с правом edit_from_front ([64a8f36](https://github.com/AlexPanich/cms/commit/64a8f3669321eefc9bc68ee7e0743ddb802a12d2))
* **texts:** именованные текстовые блоки ([30b7ad7](https://github.com/AlexPanich/cms/commit/30b7ad739c40ba2470cbcc8d315e9681bb4e2977))
* **users:** управление пользователями и ролями, E2E на Playwright ([da2a70a](https://github.com/AlexPanich/cms/commit/da2a70a2b659ffdc3c26e0fe50db082d14e9b389))


### Bug Fixes

* **auth:** сборка без переменных окружения ([32b098c](https://github.com/AlexPanich/cms/commit/32b098c94c42b415c0df348d820a366d460f193f))
* **auth:** сборка без переменных окружения ([399f6c4](https://github.com/AlexPanich/cms/commit/399f6c4c3a45f70c8fd27e38fe90e17e53125291))
* **docker:** создать каталог public при сборке ([1b95c19](https://github.com/AlexPanich/cms/commit/1b95c193671aec5ca60d79e305c24e6ba4e1447d))
* русские сообщения об ошибках валидации ([63c1094](https://github.com/AlexPanich/cms/commit/63c1094b6c0a5fbd6ccd704bdd5e8c47f4efdeeb))
