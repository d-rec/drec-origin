import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdempotencyKey1768000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "idempotency_key" (
        "key" varchar(128) NOT NULL,
        "organizationId" int NOT NULL,
        "endpoint" varchar(128) NOT NULL,
        "requestHash" varchar(64) NOT NULL,
        "statusCode" int,
        "responseBody" jsonb,
        "completedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_idempotency_key" PRIMARY KEY ("key", "organizationId")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_idempotency_key_createdAt"
        ON "idempotency_key" ("createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_idempotency_key_createdAt";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "idempotency_key";`);
  }
}
