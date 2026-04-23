import { MigrationInterface, QueryRunner } from 'typeorm';

// Realigns every serial-style sequence on the public schema so last_value
// matches max(owning_column). Stage's RDS had several sequences — notably
// user_role_id_seq (last=1, max=6) — out of sync, which broke the next
// INSERT that used nextval(). Timestamp is deliberately below 1757000000014
// so this runs before any pending seed/insert migrations on a stale env.
// Idempotent: on an already-aligned DB, setval() is a no-op.
export class AlignSequences1756999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE r record;
        maxid bigint;
      BEGIN
        FOR r IN
          SELECT s.sequencename, tbl.relname AS tbl, att.attname AS col
          FROM pg_sequences s
            JOIN pg_class c ON c.relname = s.sequencename AND c.relkind = 'S'
            LEFT JOIN pg_depend d ON d.objid = c.oid AND d.deptype = 'a'
            LEFT JOIN pg_class tbl ON tbl.oid = d.refobjid
            LEFT JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = d.refobjsubid
          WHERE s.schemaname = 'public' AND tbl.relname IS NOT NULL
        LOOP
          EXECUTE format('SELECT coalesce(max(%I),0) FROM %I', r.col, r.tbl) INTO maxid;
          IF maxid > 0 THEN
            -- quote_ident preserves mixed-case sequence names (e.g.
            -- device_csv_file_processing_jobs_jobId_seq); pass as the
            -- unqualified identifier — resolves via public on the search_path.
            EXECUTE format('SELECT setval(%L, %s, true)', quote_ident(r.sequencename), maxid);
          END IF;
        END LOOP;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    // no-op: realignment is always safe and cannot be meaningfully reversed
  }
}
