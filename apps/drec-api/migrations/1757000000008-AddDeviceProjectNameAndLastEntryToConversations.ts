import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceProjectNameAndLastEntryToConversations1757000000008
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.chat_conversations
        ADD COLUMN IF NOT EXISTS "lastEntryUuid" UUID DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "deviceProjectName" VARCHAR DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.chat_conversations
        DROP COLUMN IF EXISTS "lastEntryUuid",
        DROP COLUMN IF EXISTS "deviceProjectName"
    `);
  }
}
