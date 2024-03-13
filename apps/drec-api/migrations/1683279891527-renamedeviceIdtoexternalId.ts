import { MigrationInterface, QueryRunner } from 'typeorm';

export class renamedeviceIdtoexternalId1683279891527
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aggregate_meterread" RENAME COLUMN "deviceId" TO "externalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "check_certificate_issue_date_log_for_device" RENAME COLUMN "deviceid" TO "externalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delta_firstread" RENAME COLUMN "deviceId" TO "externalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_intermediate_meteread" RENAME COLUMN "deviceId" TO "externalId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
