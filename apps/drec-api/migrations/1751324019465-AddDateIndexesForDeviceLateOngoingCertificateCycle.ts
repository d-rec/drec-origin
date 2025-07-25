import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateIndexesForDeviceLateOngoingCertificateCycle1751324019465
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_dlcc_search_by_date"
      ON "device_lateongoing_certificate_cycle" ("groupId", "device_externalid", "late_start_date", "late_end_date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dlcc_search_by_date"`);
  }
}
