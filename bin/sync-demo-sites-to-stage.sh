#!/usr/bin/env bash
# sync-demo-sites-to-stage.sh
#
# Push the 3 most-recently-edited devices on develop into stage so the
# Mac/Stage demo box has a curated set of registrant artefacts to walk
# through. Idempotent: the same device IDs get DELETE+INSERTed on each
# run, leaving the rest of stage untouched.
#
# Scope:
#   - organization (wholesale; TRUNCATE CASCADE on stage first)
#   - user (wholesale; comes back after the cascade)
#   - device (the 3 chosen)
#   - documents (for the chosen devices)
#   - S3 objects referenced by documents.url, MinIO → stage S3
#
# Cascade collateral on stage (deliberately wiped — stage is
# demo-only):
#   - user_role, email_confirmation, chats, chat_conversations,
#     device_group, all stage devices/docs not in our subset.
#
# Pre-flight:
#   - migration heads on both DBs match (abort if not)
#   - operator confirms YES to proceed
#
# Requires: psql, kubectl, aws cli, jq. Stage cluster reachable via
# current kubectl context.

set -euo pipefail

# ── Tunables ─────────────────────────────────────────────────────────
DEV_DB_HOST="${DEV_DB_HOST:-localhost}"
DEV_DB_PORT="${DEV_DB_PORT:-5432}"
DEV_DB_NAME="${DEV_DB_NAME:-origin}"
DEV_DB_USER="${DEV_DB_USER:-postgres}"
DEV_DB_PASS="${DEV_DB_PASS:-postgres}"

DEV_S3_ENDPOINT="${DEV_S3_ENDPOINT:-http://localhost:9000}"
DEV_S3_BUCKET="${DEV_S3_BUCKET:-drec-documents}"
DEV_S3_KEY="${DEV_S3_KEY:-minioadmin}"
DEV_S3_SECRET="${DEV_S3_SECRET:-minioadmin}"

STAGE_NS="${STAGE_NS:-stage}"
STAGE_S3_BUCKET="${STAGE_S3_BUCKET:-stage-drec}"

DEVICE_LIMIT="${DEVICE_LIMIT:-3}"

PGCLIENT_POD="sync-pgclient-$$"

ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
    -h|--help)
      sed -n '2,40p' "$0"; exit 0 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# ── Helpers ──────────────────────────────────────────────────────────
log() { printf '[sync] %s\n' "$*" >&2; }
die() { printf '[sync] ERROR: %s\n' "$*" >&2; exit 1; }

dev_psql() {
  PGPASSWORD="$DEV_DB_PASS" psql \
    -h "$DEV_DB_HOST" -p "$DEV_DB_PORT" \
    -U "$DEV_DB_USER" -d "$DEV_DB_NAME" \
    -At -v ON_ERROR_STOP=1 "$@"
}

stage_psql() {
  # The pgclient pod runs `sleep infinity`; we exec psql per call,
  # which pulls $PG{HOST,PORT,USER,PASSWORD,DATABASE} from the pod's
  # env (set at create time from drec-api's running env).
  kubectl -n "$STAGE_NS" exec -i "$PGCLIENT_POD" -- \
    psql -At -v ON_ERROR_STOP=1 "$@"
}

cleanup() {
  if kubectl -n "$STAGE_NS" get pod "$PGCLIENT_POD" >/dev/null 2>&1; then
    log "deleting pgclient pod $PGCLIENT_POD"
    kubectl -n "$STAGE_NS" delete pod "$PGCLIENT_POD" --wait=false >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# ── Boot stage pgclient pod ──────────────────────────────────────────
log "spinning up stage pgclient pod ($PGCLIENT_POD)"
STAGE_DB_HOST=$(kubectl -n "$STAGE_NS" exec deploy/drec-api -- printenv DB_HOST)
STAGE_DB_PORT=$(kubectl -n "$STAGE_NS" exec deploy/drec-api -- printenv DB_PORT)
STAGE_DB_NAME=$(kubectl -n "$STAGE_NS" exec deploy/drec-api -- printenv DB_DATABASE)
STAGE_DB_USER=$(kubectl -n "$STAGE_NS" exec deploy/drec-api -- printenv DB_USERNAME)
STAGE_DB_PASS=$(kubectl -n "$STAGE_NS" exec deploy/drec-api -- printenv DB_PASSWORD)

kubectl -n "$STAGE_NS" run "$PGCLIENT_POD" \
  --image=postgres:16-alpine \
  --restart=Never \
  --env="PGHOST=$STAGE_DB_HOST" \
  --env="PGPORT=$STAGE_DB_PORT" \
  --env="PGDATABASE=$STAGE_DB_NAME" \
  --env="PGUSER=$STAGE_DB_USER" \
  --env="PGPASSWORD=$STAGE_DB_PASS" \
  --command -- sleep 3600 >/dev/null
kubectl -n "$STAGE_NS" wait pod "$PGCLIENT_POD" --for=condition=Ready --timeout=60s >/dev/null

# ── Pre-flight: migration heads ──────────────────────────────────────
log "comparing migration heads"
DEV_HEAD=$(dev_psql -c "SELECT name FROM migrations_drec ORDER BY id DESC LIMIT 1;")
STAGE_HEAD=$(stage_psql -c "SELECT name FROM migrations_drec ORDER BY id DESC LIMIT 1;")
if [[ "$DEV_HEAD" != "$STAGE_HEAD" ]]; then
  die "migration head mismatch — dev='$DEV_HEAD' stage='$STAGE_HEAD'. Promote develop:stage first."
fi
log "  both at: $DEV_HEAD"

# ── Pick devices ─────────────────────────────────────────────────────
log "picking $DEVICE_LIMIT most-recently-edited devices on develop"
mapfile -t DEVICE_ROWS < <(
  dev_psql -F$'\t' -c "
    SELECT id, \"siteName\", \"updatedAt\"
      FROM device
     ORDER BY \"updatedAt\" DESC
     LIMIT $DEVICE_LIMIT;"
)
[[ ${#DEVICE_ROWS[@]} -gt 0 ]] || die "no devices found on develop"

DEVICE_IDS=()
SITE_NAMES=()
for row in "${DEVICE_ROWS[@]}"; do
  id=$(cut -f1 <<<"$row")
  site=$(cut -f2 <<<"$row")
  upd=$(cut -f3 <<<"$row")
  DEVICE_IDS+=("$id")
  SITE_NAMES+=("$site")
  printf '  - id=%s  siteName=%s  updatedAt=%s\n' "$id" "$site" "$upd" >&2
done

ID_CSV=$(IFS=,; echo "${DEVICE_IDS[*]}")
SITE_SQL_LIST=$(printf "'%s'," "${SITE_NAMES[@]}" | sed 's/,$//')

# ── Confirm ──────────────────────────────────────────────────────────
if [[ $ASSUME_YES -ne 1 ]]; then
  read -r -p "Type YES to overwrite these device rows on stage: " ans < /dev/tty
  [[ "$ans" == "YES" ]] || die "aborted by operator"
fi

# ── Snapshot dev rows to local files (CSV + columns) ─────────────────
WORKDIR=$(mktemp -d)
log "snapshotting dev rows to $WORKDIR"

dump_table() {
  # $1 = bare table name (information_schema lookup); SQL identifier
  # is built as "$1" (double-quoted) for SELECT / COPY / FROM.
  local table=$1 where=$2
  local cols
  cols=$(dev_psql -c "
    SELECT string_agg(format('\"%s\"', column_name), ',' ORDER BY ordinal_position)
      FROM information_schema.columns
     WHERE table_name='$table' AND table_schema='public';")
  echo "$cols" > "$WORKDIR/$table.cols"
  dev_psql -c "\\COPY (SELECT $cols FROM \"$table\" WHERE $where) TO STDOUT WITH (FORMAT csv, FORCE_QUOTE *)" > "$WORKDIR/$table.csv"
  wc -l "$WORKDIR/$table.csv" >&2
}

# Wholesale tables (no WHERE) — README creds make these effectively
# shared singletons across envs anyway.
dump_table organization "TRUE"
dump_table user         "TRUE"

dump_table device           "id IN ($ID_CSV)"
dump_table documents        "target_type='device' AND target_id IN ($ID_CSV)"

# chats / chat_conversations / user_role intentionally not synced —
# they get nuked by the TRUNCATE organization CASCADE on stage and
# stay empty after the reload, which is fine for canned demos.

# ── Apply to stage in one transaction ────────────────────────────────
log "applying to stage in a single transaction"

apply_table() {
  # Stream the dev CSV into the named stage table. Assumes the
  # earlier TRUNCATE organization CASCADE has emptied all related
  # tables so plain INSERT can't hit a uniqueness collision.
  local table=$1
  local cols col_types
  cols=$(cat "$WORKDIR/$table.cols")
  local csv_file="$WORKDIR/$table.csv"
  [[ -s "$csv_file" ]] || { log "  $table: no rows, skipping"; return; }

  # Use format_type() so user-defined types (e.g. typeorm enums)
  # come back with their real names instead of "USER-DEFINED".
  col_types=$(dev_psql -c "
    SELECT string_agg(format('\"%s\" %s', a.attname, format_type(a.atttypid, a.atttypmod)),
                      ',' ORDER BY a.attnum)
      FROM pg_attribute a
     WHERE a.attrelid = '\"$table\"'::regclass
       AND a.attnum > 0 AND NOT a.attisdropped;")

  {
    echo "BEGIN;"
    echo "CREATE TEMP TABLE _sync ($col_types);"
    echo "\\COPY _sync ($cols) FROM STDIN WITH (FORMAT csv);"
    cat "$csv_file"
    echo "\\."
    # ON CONFLICT DO NOTHING: dev's data sometimes violates stage's
    # stricter uniqueness (e.g. dev has duplicate phone_numbers that
    # stage's UQ_user_phone_number won't accept). Silently drop
    # those rows rather than failing the whole sync.
    echo "INSERT INTO \"$table\" ($cols) SELECT $cols FROM _sync ON CONFLICT DO NOTHING;"
    echo "DROP TABLE _sync;"
    echo "COMMIT;"
  } | stage_psql
  log "  $table: applied"
}

log "TRUNCATE organization CASCADE on stage (wipes user-data tables)"
echo "TRUNCATE TABLE organization RESTART IDENTITY CASCADE;" | stage_psql

# documents uses polymorphic (target_type, target_id) instead of a
# real FK on device, so the cascade above misses it — stale doc rows
# from a previous run would otherwise survive and ON CONFLICT DO
# NOTHING would silently skip the fresh ones. Wipe the slice we're
# about to re-import so updates to any doc actually propagate.
log "DELETE stale documents for chosen devices on stage"
echo "DELETE FROM documents WHERE target_type='device' AND target_id IN ($ID_CSV);" | stage_psql

# Order matters: organization → user → device → documents.
apply_table organization
apply_table user
apply_table device
apply_table documents

# ── Copy S3 objects ──────────────────────────────────────────────────
log "copying S3 objects from MinIO ($DEV_S3_BUCKET) to stage ($STAGE_S3_BUCKET)"

# documents.url column index in the snapshotted CSV
URL_IDX=$(dev_psql -c "
  SELECT ordinal_position
    FROM information_schema.columns
   WHERE table_name='documents' AND table_schema='public' AND column_name='url';")

if [[ -z "$URL_IDX" ]]; then
  log "  documents.url column not found, skipping S3 copy"
else
  # Extract URL column from the CSV (quoted CSV — use python to parse safely)
  python3 - "$WORKDIR/documents.csv" "$URL_IDX" <<'PY' > "$WORKDIR/keys.txt"
import csv, sys
with open(sys.argv[1]) as f:
    for row in csv.reader(f):
        idx = int(sys.argv[2]) - 1
        if idx < len(row):
            print(row[idx])
PY

  copied=0; skipped=0
  while IFS= read -r key; do
    [[ -z "$key" ]] && continue
    # Source via MinIO endpoint, dest via default AWS creds
    if AWS_ACCESS_KEY_ID="$DEV_S3_KEY" AWS_SECRET_ACCESS_KEY="$DEV_S3_SECRET" \
       aws --endpoint-url "$DEV_S3_ENDPOINT" s3 cp \
       "s3://$DEV_S3_BUCKET/$key" - 2>/dev/null \
       | aws s3 cp - "s3://$STAGE_S3_BUCKET/$key" >/dev/null 2>&1; then
      copied=$((copied + 1))
    else
      skipped=$((skipped + 1))
      log "  WARN: failed to copy $key"
    fi
  done < "$WORKDIR/keys.txt"
  log "  S3: copied=$copied skipped=$skipped"
fi

# ── Done ─────────────────────────────────────────────────────────────
log "done. Stage now has the develop snapshot of:"
for i in "${!DEVICE_IDS[@]}"; do
  printf '  %s — id=%s\n' "${SITE_NAMES[$i]}" "${DEVICE_IDS[$i]}" >&2
done
rm -rf "$WORKDIR"
