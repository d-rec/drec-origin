import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastReadAtToConversations1757000000016
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE chat_conversations
        ADD COLUMN IF NOT EXISTS "lastReadAt1" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "lastReadAt2" TIMESTAMPTZ;
    `);
    // Null out any values so existing conversations show as unread
    await queryRunner.query(`
      UPDATE chat_conversations SET "lastReadAt1" = NULL, "lastReadAt2" = NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE chat_conversations
        DROP COLUMN "lastReadAt1",
        DROP COLUMN "lastReadAt2";
    `);
  }
}
