-- Change-history triggers for the evidentiary tables.
--
-- Records every INSERT / UPDATE / DELETE on the 15 protected tables into
-- history.changes, with the previous and new row, the connected database
-- user and the time.
--
-- Run as the table owner (postgres). Idempotent: safe to re-run.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f history-triggers.sql
--
-- Differences from the April 2026 version, which had to be withdrawn:
--   * the primary-key column is a trigger argument. certificate_read_model
--     has no "id" column, so the old "OLD.id" raised on every certificate
--     write and aborted the mint transaction.
--   * the function is SECURITY DEFINER with a pinned search_path, so the
--     application role needs no INSERT privilege on history.changes.
--   * changed_by is session_user. Inside a SECURITY DEFINER function
--     current_user is always the function owner.
--   * UPDATEs that change nothing are skipped, and on
--     device_lateongoing_certificate_cycle so are UPDATEs that only stamp
--     checked_at / updatedAt. That cron touches ~900k rows several times a
--     day and produced 93% of the old history volume (5.6M rows in 8 days).
--   * TRUNCATE is recorded too (it bypasses row triggers).

SET client_min_messages = warning;

CREATE SCHEMA IF NOT EXISTS history;

CREATE TABLE IF NOT EXISTS history.changes (
  id          bigserial PRIMARY KEY,
  table_name  text NOT NULL,
  operation   text NOT NULL,
  row_id      integer,
  old_data    jsonb,
  new_data    jsonb,
  changed_by  text,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_changes_table_row
  ON history.changes (table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_changes_changed_at
  ON history.changes USING brin (changed_at);

CREATE OR REPLACE FUNCTION history.record_change() RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = pg_catalog, pg_temp
AS $fn$
DECLARE
  pk    text := COALESCE(TG_ARGV[0], 'id');
  old_j jsonb;
  new_j jsonb;
  rid   text;
BEGIN
  IF TG_OP = 'TRUNCATE' THEN
    INSERT INTO history.changes (table_name, operation, changed_by)
    VALUES (TG_TABLE_NAME, TG_OP, session_user);
    RETURN NULL;
  END IF;

  IF TG_OP <> 'INSERT' THEN old_j := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN new_j := to_jsonb(NEW); END IF;
  rid := COALESCE(new_j, old_j) ->> pk;

  INSERT INTO history.changes
    (table_name, operation, row_id, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN rid ~ '^[0-9]{1,9}$' THEN rid::integer END,
    old_j,
    new_j,
    session_user
  );
  RETURN NULL;  -- AFTER trigger: return value is ignored
END;
$fn$;

REVOKE ALL ON FUNCTION history.record_change() FROM PUBLIC;

DO $do$
DECLARE
  t  text;
  pk text;
  protected constant text[] := ARRAY[
    'meter_reads', 'aggregate_meterread', 'history_intermediate_meteread',
    'device', 'device_group', 'certificate_read_model', 'issuer_certificate',
    'old_issuer_certificate', 'check_certificate_issue_date_log_for_device',
    'check_certificate_issue_date_log_for_device_group',
    'device_lateongoing_certificate_cycle',
    'next_issuance_date_log_for_device_group', 'delta_firstread',
    'history_next_issueance_log', 'organization'
  ];
BEGIN
  FOREACH t IN ARRAY protected LOOP
    IF to_regclass('public.' || quote_ident(t)) IS NULL THEN
      RAISE EXCEPTION 'protected table % does not exist', t;
    END IF;

    -- single-column primary key of the table
    SELECT a.attname INTO STRICT pk
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
     WHERE i.indrelid = ('public.' || quote_ident(t))::regclass
       AND i.indisprimary AND i.indnatts = 1;

    -- trigger names are per table, so the same three names are used on each
    -- (a table-name suffix overflows the 63-character identifier limit)
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_history_' || t, t);  -- April 2026 name
    EXECUTE format('DROP TRIGGER IF EXISTS trg_history_row ON public.%I', t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_history_upd ON public.%I', t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_history_trunc ON public.%I', t);

    EXECUTE format(
      'CREATE TRIGGER trg_history_row AFTER INSERT OR DELETE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION history.record_change(%2$L)', t, pk);

    IF t = 'device_lateongoing_certificate_cycle' THEN
      EXECUTE format(
        'CREATE TRIGGER trg_history_upd AFTER UPDATE ON public.%1$I
           FOR EACH ROW
           WHEN ((to_jsonb(OLD) - ''checked_at'' - ''updatedAt'')
                 IS DISTINCT FROM
                 (to_jsonb(NEW) - ''checked_at'' - ''updatedAt''))
           EXECUTE FUNCTION history.record_change(%2$L)', t, pk);
    ELSE
      EXECUTE format(
        'CREATE TRIGGER trg_history_upd AFTER UPDATE ON public.%1$I
           FOR EACH ROW
           -- compared as jsonb: row comparison fails on json-typed columns
           WHEN (to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW))
           EXECUTE FUNCTION history.record_change(%2$L)', t, pk);
    END IF;

    EXECUTE format(
      'CREATE TRIGGER trg_history_trunc AFTER TRUNCATE ON public.%1$I
         FOR EACH STATEMENT EXECUTE FUNCTION history.record_change()', t);
  END LOOP;
END;
$do$;

-- The history is append-only for everyone but the owner.
REVOKE ALL ON SCHEMA history FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA history FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA history FROM PUBLIC;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'drec_app') THEN
    GRANT USAGE ON SCHEMA history TO drec_app;
    REVOKE ALL ON ALL TABLES IN SCHEMA history FROM drec_app;
    GRANT SELECT ON history.changes TO drec_app;
  END IF;
END;
$do$;
