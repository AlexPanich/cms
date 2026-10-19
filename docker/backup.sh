#!/bin/sh
# Резервные копии CMS: дамп БД (pg_dump, custom-формат) и архив загруженных файлов.
# Запускается в сервисе backup из docker-compose.prod.yml:
#   schedule            — копия сразу и затем раз в BACKUP_INTERVAL_HOURS, старше BACKUP_KEEP_DAYS удаляются
#   once                — одна копия сейчас
#   restore <метка>     — восстановить БД и файлы из копии с меткой вида 20261019-030000
#                         (приложение перед этим остановить: docker compose ... stop app)
set -eu

BACKUP_DIR=/backups
STORAGE_DIR=/storage
INTERVAL_HOURS=${BACKUP_INTERVAL_HOURS:-24}
KEEP_DAYS=${BACKUP_KEEP_DAYS:-14}
# Владелец файлов в контейнере приложения (пользователь nextjs из Dockerfile).
APP_UID=1001

log() {
	echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*"
}

backup() {
	stamp=$(date -u +%Y%m%d-%H%M%S)
	db_file="$BACKUP_DIR/db-$stamp.dump"
	files_file="$BACKUP_DIR/storage-$stamp.tar.gz"

	# Пишем во временный файл: оборванная копия не должна выглядеть готовой.
	pg_dump --format=custom --file="$db_file.tmp"
	mv "$db_file.tmp" "$db_file"
	tar -czf "$files_file.tmp" -C "$STORAGE_DIR" .
	mv "$files_file.tmp" "$files_file"
	log "копия $stamp: $(du -h "$db_file" | cut -f1) БД, $(du -h "$files_file" | cut -f1) файлы"

	find "$BACKUP_DIR" -type f \( -name 'db-*.dump' -o -name 'storage-*.tar.gz' \) \
		-mtime +"$KEEP_DAYS" -exec rm -f {} +
}

restore() {
	stamp=$1
	db_file="$BACKUP_DIR/db-$stamp.dump"
	files_file="$BACKUP_DIR/storage-$stamp.tar.gz"
	for file in "$db_file" "$files_file"; do
		[ -f "$file" ] || { log "нет файла $file"; exit 1; }
	done

	log "восстановление БД из $db_file"
	pg_restore --clean --if-exists --no-owner --single-transaction --dbname="$PGDATABASE" "$db_file"

	log "восстановление файлов из $files_file"
	find "$STORAGE_DIR" -mindepth 1 -delete
	tar -xzf "$files_file" -C "$STORAGE_DIR"
	chown -R "$APP_UID:$APP_UID" "$STORAGE_DIR"
	log "готово, запустите приложение: docker compose -f docker-compose.prod.yml start app"
}

case "${1:-schedule}" in
	schedule)
		while true; do
			backup || log "ошибка резервного копирования"
			sleep $((INTERVAL_HOURS * 3600))
		done
		;;
	once)
		backup
		;;
	restore)
		[ $# -eq 2 ] || { echo "использование: backup.sh restore <метка>" >&2; exit 2; }
		restore "$2"
		;;
	*)
		echo "использование: backup.sh schedule | once | restore <метка>" >&2
		exit 2
		;;
esac
