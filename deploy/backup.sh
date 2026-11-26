#!/usr/bin/env bash
# Daily Mongo backup, keeps the last 7. Cron (crontab -e):
#   30 3 * * * ~/apps/tourly/backup.sh >> ~/apps/tourly/backups/backup.log 2>&1
# Restore: docker compose -f docker-compose.prod.yml exec -T mongo sh -c \
#   'mongorestore -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip --drop' < backups/<file>.gz
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backups

FILE="backups/tourly-$(date +%F-%H%M).gz"
docker compose -f docker-compose.prod.yml exec -T mongo sh -c \
  'mongodump -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db tourly --archive --gzip' > "$FILE"

ls -1t backups/tourly-*.gz | tail -n +8 | xargs -r rm --
echo "✓ $FILE ($(du -h "$FILE" | cut -f1))"
