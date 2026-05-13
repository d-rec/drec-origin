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
#   - api_user (wholesale; holds Registrant permission_status — login
#     for Registrant users crashes if user.api_user_id has no row
#     here)
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
# Order users by email so README accounts (evident.demo@…) come
# before junk accounts (joe.orgadmin@…) that share a phone number.
# Stage's UQ_user_phone_number keeps the first row inserted; without
# this ordering evident.demo silently lost the race and the README
# login on stage 401'd.
dump_table user         "TRUE ORDER BY email"
dump_table api_user     "TRUE"

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

# ── Snapshot stage-only users before the wipe ────────────────────────
# Anything on stage with an email not present in dev's user table is
# stage-only (operator accounts, personal reviewer accounts,
# environment-specific logins). Save their row + api_user row to
# local files so we can re-INSERT them after the TRUNCATE.
log "snapshotting stage-only users (email NOT IN dev emails)"
DEV_EMAILS_SQL=$(PGPASSWORD="$DEV_DB_PASS" psql \
  -h "$DEV_DB_HOST" -p "$DEV_DB_PORT" -U "$DEV_DB_USER" -d "$DEV_DB_NAME" \
  -At -c "SELECT string_agg(format('%L', email), ',') FROM \"user\";")
[[ -n "$DEV_EMAILS_SQL" ]] || DEV_EMAILS_SQL="''"

STAGE_ONLY_COLS=$(stage_psql -c "
  SELECT string_agg(format('\"%s\"', a.attname), ',' ORDER BY a.attnum)
    FROM pg_attribute a
   WHERE a.attrelid = '\"user\"'::regclass
     AND a.attnum > 0 AND NOT a.attisdropped;")
stage_psql -c "\\COPY (SELECT $STAGE_ONLY_COLS FROM \"user\" WHERE email NOT IN ($DEV_EMAILS_SQL)) TO STDOUT WITH (FORMAT csv, FORCE_QUOTE *)" > "$WORKDIR/stage_only_user.csv"
echo "$STAGE_ONLY_COLS" > "$WORKDIR/stage_only_user.cols"
stage_psql -c "\\COPY (SELECT * FROM api_user WHERE api_user_id IN (SELECT api_user_id FROM \"user\" WHERE email NOT IN ($DEV_EMAILS_SQL) AND api_user_id IS NOT NULL)) TO STDOUT WITH (FORMAT csv, FORCE_QUOTE *)" > "$WORKDIR/stage_only_api_user.csv"
STAGE_ONLY_COUNT=$(wc -l < "$WORKDIR/stage_only_user.csv")
log "  $STAGE_ONLY_COUNT stage-only user row(s) preserved"

log "TRUNCATE organization CASCADE on stage (wipes user-data tables)"
echo "TRUNCATE TABLE organization RESTART IDENTITY CASCADE;" | stage_psql

# documents uses polymorphic (target_type, target_id) instead of a
# real FK on device, so the cascade above misses it — stale doc rows
# from a previous run would otherwise survive and ON CONFLICT DO
# NOTHING would silently skip the fresh ones. Wipe the slice we're
# about to re-import so updates to any doc actually propagate.
log "DELETE stale documents for chosen devices on stage"
echo "DELETE FROM documents WHERE target_type='device' AND target_id IN ($ID_CSV);" | stage_psql

# api_user must come before user because user.api_user_id references
# it. organization → api_user → user → device → documents.
log "DELETE existing api_user rows on stage (will re-INSERT from dev)"
echo "DELETE FROM api_user;" | stage_psql

apply_table organization
apply_table api_user
apply_table user
apply_table device
apply_table documents

# Restore the stage-only users snapshotted just before the wipe.
# Re-point them at SuperOrg (id=1) since their original stage-only
# org is gone — they keep their existing password hash, role,
# status, and api_user link.
if [[ -s "$WORKDIR/stage_only_user.csv" ]]; then
  log "restoring $(wc -l < "$WORKDIR/stage_only_user.csv") stage-only user row(s)"
  USER_COL_TYPES=$(stage_psql -c "
    SELECT string_agg(format('\"%s\" %s', a.attname, format_type(a.atttypid, a.atttypmod)), ',' ORDER BY a.attnum)
      FROM pg_attribute a
     WHERE a.attrelid = '\"user\"'::regclass
       AND a.attnum > 0 AND NOT a.attisdropped;")
  USER_COLS=$(cat "$WORKDIR/stage_only_user.cols")
  # Re-INSERT api_user rows first (if any) so user.api_user_id
  # resolves.
  if [[ -s "$WORKDIR/stage_only_api_user.csv" ]]; then
    {
      echo "BEGIN;"
      echo "CREATE TEMP TABLE _so_api (api_user_id uuid, \"permissionIds\" jsonb, permission_status text);"
      echo "\\COPY _so_api FROM STDIN WITH (FORMAT csv);"
      cat "$WORKDIR/stage_only_api_user.csv"
      echo "\\."
      echo "INSERT INTO api_user (api_user_id, \"permissionIds\", permission_status) SELECT api_user_id, \"permissionIds\", permission_status FROM _so_api ON CONFLICT (api_user_id) DO NOTHING;"
      echo "DROP TABLE _so_api;"
      echo "COMMIT;"
    } | stage_psql
  fi
  {
    echo "BEGIN;"
    echo "CREATE TEMP TABLE _so_user ($USER_COL_TYPES);"
    echo "\\COPY _so_user ($USER_COLS) FROM STDIN WITH (FORMAT csv);"
    cat "$WORKDIR/stage_only_user.csv"
    echo "\\."
    echo "INSERT INTO \"user\" ($USER_COLS) SELECT $USER_COLS FROM _so_user ON CONFLICT (email) DO NOTHING;"
    # Re-point any restored user whose original organizationId is
    # no longer present onto SuperOrg (id=1) so they can log in.
    echo "UPDATE \"user\" SET \"organizationId\" = 1 WHERE email IN (SELECT email FROM _so_user) AND \"organizationId\" NOT IN (SELECT id FROM organization);"
    echo "DROP TABLE _so_user;"
    echo "COMMIT;"
  } | stage_psql
fi

# Stage-only admin account that the TRUNCATE CASCADE wiped — gets
# recreated post-sync with a fresh bcrypt hash so the operator can
# still reach the Admin panel on stage after a demo refresh. Uses
# SuperOrg (id=1) which is part of every snapshot.
STAGEADMIN_PASSWORD="${STAGEADMIN_PASSWORD:-StageAdmin2026!}"
log "restoring stage-only admin: stageadmin@drecs.org"
STAGEADMIN_HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw(b'$STAGEADMIN_PASSWORD', bcrypt.gensalt(rounds=8)).decode())")
STAGEADMIN_APIID=$(python3 -c "import uuid; print(uuid.uuid4())")
{
  echo "INSERT INTO api_user (api_user_id, permission_status) VALUES ('$STAGEADMIN_APIID', 'Active') ON CONFLICT DO NOTHING;"
  echo "INSERT INTO \"user\" (id, \"createdAt\", \"updatedAt\", title, \"firstName\", \"lastName\", phone_number, email, password, status, role, \"organizationId\", \"roleId\", api_user_id) VALUES (100, NOW(), NOW(), 'Mr', 'Stage', 'Admin', '+33000000000', 'stageadmin@drecs.org', '$STAGEADMIN_HASH', 'Active', 'Admin', 1, 1, '$STAGEADMIN_APIID') ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, api_user_id = EXCLUDED.api_user_id;"
} | stage_psql

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
