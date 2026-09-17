#!/usr/bin/env bash
# Gini_AI SQLite backup: live dev.db -> daily (keep 7) + weekly (keep 4) copies.
# Backs up BOTH known locations (./dev.db and ./prisma/dev.db) because the
# app resolves "file:./dev.db" relative to cwd — see audit notes.
# Usage: ./backup-sqlite.sh [--weekly]
# Cron:
#   45 2 * * * /home/rohit/Company/GiniVibe/GiniVibe-Search/GiniVibe/backend/microservices/Gini_AI/backup-sqlite.sh >> /var/log/ginivibe-backup.log 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAILY_DIR="$SCRIPT_DIR/backups/daily"
WEEKLY_DIR="$SCRIPT_DIR/backups/weekly"
DAILY_KEEP=7
WEEKLY_KEEP=4

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

FORCE_WEEKLY="false"
if [[ "${1:-}" == "--weekly" ]]; then FORCE_WEEKLY="true"; fi

STAMP="$(date +%Y%m%d-%H%M%S)"
DOW="$(date +%u)"

safe_copy() {
  local src="$1" dest="$2"
  if [[ ! -f "$src" ]]; then echo "skip (missing): $src"; return 0; fi
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$src" ".backup '$dest'" # crash-safe online copy
  else
    cp "$src" "$dest"
  fi
  echo "[$(date -Is)] wrote $dest"
}

prune() {
  local dir="$1" pattern="$2" keep="$3"
  # shellcheck disable=SC2012
  ls -1t "$dir"/$pattern 2>/dev/null | tail -n +"$((keep + 1))" | xargs -r rm -f
}

for label in "dev" "prisma-dev"; do
  if [[ "$label" == "dev" ]]; then SRC="$SCRIPT_DIR/dev.db"; else SRC="$SCRIPT_DIR/prisma/dev.db"; fi
  DAILY_FILE="$DAILY_DIR/gini_ai-$label-daily-$STAMP.db"
  safe_copy "$SRC" "$DAILY_FILE"
  prune "$DAILY_DIR" "gini_ai-$label-daily-*.db" "$DAILY_KEEP"

  if [[ "$FORCE_WEEKLY" == "true" || "$DOW" == "7" ]]; then
    WEEKLY_FILE="$WEEKLY_DIR/gini_ai-$label-weekly-$STAMP.db"
    [[ -f "$DAILY_FILE" ]] && cp "$DAILY_FILE" "$WEEKLY_FILE"
    prune "$WEEKLY_DIR" "gini_ai-$label-weekly-*.db" "$WEEKLY_KEEP"
  fi
done

echo "[$(date -Is)] sqlite backup OK"
