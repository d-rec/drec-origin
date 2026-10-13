import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `field_capture` — a nameplate capture taken in the field by a site operator:
 * one photo, one serial, one GPS fix, plus the few device fields that cannot be
 * deferred.
 *
 * Deliberately separate from `device`. `POST /device` creates a live device
 * immediately, and devices feed reservations, production ceilings and issuance;
 * a phone in a field is not an authority on any of that. A capture carries no
 * weight until a reviewer approves it, at which point `device_id` is set.
 *
 * `client_capture_id` is unique because the capture screen queues offline and
 * retries: without it one flaky uplink turns one panel into three pending rows.
 */
export class CreateFieldCapture1784000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "field_capture" (
        "id"                 SERIAL PRIMARY KEY,
        "uuid"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "client_capture_id"  uuid NOT NULL,
        "organization_id"    integer NOT NULL,
        "submitted_by_email" character varying NOT NULL,
        "status"             character varying NOT NULL DEFAULT 'Pending',
        "serial_number"      character varying NOT NULL,
        "serial_raw"         character varying,
        "serial_source"      character varying NOT NULL,
        "ocr_confidence"     double precision,
        "latitude"           character varying NOT NULL,
        "longitude"          character varying NOT NULL,
        "gps_accuracy_m"     double precision,
        "photo_key"          character varying NOT NULL,
        "payload"            jsonb NOT NULL DEFAULT '{}'::jsonb,
        "matched_device_id"  integer,
        "device_id"          integer,
        "review_note"        text,
        "reviewed_by_email"  character varying,
        "reviewed_at"        timestamptz,
        "captured_at"        timestamptz,
        "created_at"         timestamptz NOT NULL DEFAULT now(),
        "updated_at"         timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_field_capture_uuid"
        ON "field_capture" ("uuid")
    `);
    // The idempotency guarantee the offline queue relies on.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_field_capture_client_capture_id"
        ON "field_capture" ("client_capture_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_field_capture_organization_id"
        ON "field_capture" ("organization_id")
    `);
    // The reviewer queue is "status = 'Pending' ORDER BY created_at".
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_field_capture_status"
        ON "field_capture" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_field_capture_device_id"
        ON "field_capture" ("device_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "field_capture"`);
  }
}
