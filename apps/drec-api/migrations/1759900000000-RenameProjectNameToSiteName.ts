import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameProjectNameToSiteName1759900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename column on device table (idempotent)
    const hasProjectName = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'device' AND column_name = 'projectName'
    `);
    if (hasProjectName.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "device"
        RENAME COLUMN "projectName" TO "siteName"
      `);
    }

    // Rename column on chat_conversations table (idempotent)
    const hasDeviceProjectName = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'chat_conversations' AND column_name = 'deviceProjectName'
    `);
    if (hasDeviceProjectName.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "chat_conversations"
        RENAME COLUMN "deviceProjectName" TO "deviceSiteName"
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "device"
      RENAME COLUMN "siteName" TO "projectName"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_conversations"
      RENAME COLUMN "deviceSiteName" TO "deviceProjectName"
    `);
  }
}
