import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUploadLogTable1759500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "upload_log" (
        "id"                  SERIAL PRIMARY KEY,
        "device_id"           integer,
        "user_id"             integer NOT NULL,
        "user_email"          varchar(255) NOT NULL,
        "organization_id"     integer,
        "channel"             varchar(20) NOT NULL DEFAULT 'portal',
        "action_type"         varchar(50) NOT NULL,
        "file_name"           varchar(500),
        "file_size_bytes"     integer,
        "file_hash_sha256"    varchar(64),
        "payload_hash_sha256" varchar(64),
        "ip_address"          varchar(45),
        "user_agent"          text,
        "metadata"            jsonb,
        "created_at"          timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_upload_log_device_id" ON "upload_log" ("device_id");
      CREATE INDEX "IDX_upload_log_user_id" ON "upload_log" ("user_id");
      CREATE INDEX "IDX_upload_log_created_at" ON "upload_log" ("created_at");
      CREATE INDEX "IDX_upload_log_action_type" ON "upload_log" ("action_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "upload_log";`);
  }
}
