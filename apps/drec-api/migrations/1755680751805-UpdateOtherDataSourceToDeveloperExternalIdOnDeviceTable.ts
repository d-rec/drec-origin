import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOtherDataSourceToDeveloperExternalIdOnDeviceTable1755680751805
  implements MigrationInterface
{
  name = 'UpdateOtherDataSourceToDeveloperExternalIdOnDeviceTable1755680751805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE device 
            SET "other_data_source" = "developerExternalId"
            WHERE "developerExternalId" IS NOT NULL 
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE device 
            SET "other_data_source" = "developerExternalId"
            WHERE "developerExternalId" IS NULL 
        `);
  }
}
