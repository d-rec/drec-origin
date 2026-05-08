import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiResponseCache1763600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_response_cache" (
        "content_hash" VARCHAR(64) NOT NULL,
        "endpoint"     VARCHAR(64) NOT NULL,
        "response"     JSONB NOT NULL,
        "created_at"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        PRIMARY KEY ("content_hash", "endpoint")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ai_response_cache_created_at" ON "ai_response_cache" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_response_cache"`);
  }
}
