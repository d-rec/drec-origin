import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesToDeviceLateongoingCertificateCycle1748259999999
  implements MigrationInterface
{
  name = 'AddIndexesToDeviceLateongoingCertificateCycle1748259999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_dlcc_group_active_unissued"
      ON "device_lateongoing_certificate_cycle" ("groupId")
      WHERE "archived_at" IS NULL AND "certificate_issued" = false;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dlcc_group_externalid_active_unissued"
      ON "device_lateongoing_certificate_cycle" ("groupId", "device_externalid")
      WHERE "archived_at" IS NULL AND "certificate_issued" = false;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dlcc_group_externalid_active"
      ON "device_lateongoing_certificate_cycle" ("groupId", "device_externalid")
      WHERE "archived_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dlcc_group_active_unissued"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dlcc_group_externalid_active_unissued"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dlcc_group_externalid_active"`,
    );
  }
}
