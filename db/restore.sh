#!/usr/bin/env bash
# GiniVibe Postgres restore from a daily/weekly backup copy.
# Safety first: takes a fresh dump of the LIVE db before touching anything.
# Usage:
#   ./restore.sh backups/weekly/ginivibe-weekly-20260914-023000.dump [--yes]
set -euo pipefail

CONTAINER="ginivibe-postgres"
PGUSER="root"
PGDB="ginivibe"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <backup-file.dump> [--yes]"
  echo "available copies (newest first):"
  # shellcheck disable=SC2012
  ls -1t "$SCRIPT_DIR"/backups/daily "$SCRIPT_DIR"/backups/weekly 2>/dev/null || true
  exit 1
fi

SRC="$1"
CONFIRM="${2:-}"
if [[ ! -f "$SRC" ]]; then echo "not found: $SRC"; exit 1; fi

if [[ "$CONFIRM" != "--yes" ]]; then
  echo "This will REPLACE live database '$PGDB' with '$SRC'."
  read -rp "Type RESTORE to continue: " ans
  if [[ "$ans" != "RESTORE" ]]; then echo "aborted."; exit 1; fi
fi

SAFETY="$SCRIPT_DIR/backups/pre-restore-$(date +%Y%m%d-%H%M%S).dump"
echo "safety dump of live db -> $SAFETY"
docker exec "$CONTAINER" pg_dump -U "$PGUSER" -Fc "$PGDB" > "$SAFETY"

echo "restoring $SRC into $PGDB ..."
docker cp "$SRC" "$CONTAINER:/tmp/restore.dump"
docker exec "$CONTAINER" pg_restore -U "$PGUSER" -d "$PGDB" --clean --if-exists /tmp/restore.dump
docker exec "$CONTAINER" rm -f /tmp/restore.dump

echo "[$(date -Is)] restore OK (pre-restore safety copy: $SAFETY)"
