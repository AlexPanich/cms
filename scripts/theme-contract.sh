#!/bin/sh
# Проверка контракта темы на второй теме (e2e/theme): она подставляется на место src/theme,
# как тема в репозитории клиента, и на ней проходят typecheck, lint, unit-тесты, сборка
# и e2e/theme-contract.spec.ts.
#
# В CI (CI=true) — прямо в рабочей копии. Локально — в копии репозитория во временном каталоге
# на порту 3100, рабочая копия и dev-сервер не трогаются. Нужен запущенный Postgres из .env.
set -eu

if [ -z "${CI:-}" ]; then
  root=$(pwd)
  copy=$(mktemp -d)
  trap 'rm -rf "$copy"' EXIT
  echo "Копия репозитория: $copy"
  rsync -a --exclude node_modules --exclude .next --exclude test-results --exclude storage \
    --exclude legacy --exclude backups "$root/" "$copy/"
  cd "$copy"
  pnpm install --frozen-lockfile --offline --silent
  export PORT=3100 BETTER_AUTH_URL=http://localhost:3100 STORAGE_DIR="$copy/storage"
fi

rm -rf src/theme
cp -R e2e/theme src/theme

pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright test e2e/theme-contract.spec.ts
