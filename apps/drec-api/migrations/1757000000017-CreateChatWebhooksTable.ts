import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatWebhooksTable1757000000017
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_webhooks (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "organizationId" INTEGER,
        url VARCHAR NOT NULL,
        secret VARCHAR NOT NULL,
        events VARCHAR NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS chat_webhooks`);
  }
}
