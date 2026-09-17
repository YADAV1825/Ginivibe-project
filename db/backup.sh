#!/usr/bin/env bash
# GiniVibe Postgres backup: live DB -> daily (keep 7) + weekly (keep 4) copies.
# Usage:
#   ./backup.sh            # daily copy; also writes weekly copy on Sundays
#   ./backup.sh --weekly   # force a weekly copy
# Cron (runs as a user with docker access):
#   30 2 * * * /home/rohit/Company/GiniVibe/GiniVibe-Search/GiniVibe/db/backup.sh >> /var/log/ginivibe-backup.log 2>&1
set -euo pipefail

CONTAINER="ginivibe-postgres"
PGUSER="root"
PGDB="ginivibe"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAILY_DIR="$SCRIPT_DIR/backups/daily"
WEEKLY_DIR="$SCRIPT_DIR/backups/weekly"
DAILY_KEEP=7
WEEKLY_KEEP=4

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

FORCE_WEEKLY="false"
if [[ "${1:-}" == "--weekly" ]]; then FORCE_WEEKLY="true"; fi

STAMP="$(date +%Y%m%d-%H%M%S)"
DOW="$(date +%u)" # 7 = Sunday

dump() {
  local dest="$1"
  if docker exec "$CONTAINER" pg_isready -U "$PGUSER" >/dev/null 2>&1; then
    docker exec "$CONTAINER" pg_dump -U "$PGUSER" -Fc "$PGDB" > "$dest"
  else
    # Fallback: local pg_dump over TCP (needs PGPASSWORD set).
    pg_dump -h localhost -U "$PGUSER" -Fc "$PGDB" > "$dest"
  fi
  echo "[$(date -Is)] wrote $dest ($(du -h "$dest" | cut -f1))"
}

prune() {
  local dir="$1" keep="$2"
  # shellcheck disable=SC2012
  ls -1t "$dir"/ginivibe-*.dump 2>/dev/null | tail -n +"$((keep + 1))" | xargs -r rm -f
}

DAILY_FILE="$DAILY_DIR/ginivibe-daily-$STAMP.dump"
dump "$DAILY_FILE"
prune "$DAILY_DIR" "$DAILY_KEEP"

if [[ "$FORCE_WEEKLY" == "true" || "$DOW" == "7" ]]; then
  WEEKLY_FILE="$WEEKLY_DIR/ginivibe-weekly-$STAMP.dump"
  cp "$DAILY_FILE" "$WEEKLY_FILE"
  echo "[$(date -Is)] weekly snapshot $WEEKLY_FILE"
  prune "$WEEKLY_DIR" "$WEEKLY_KEEP"
fi

echo "[$(date -Is)] backup OK"
