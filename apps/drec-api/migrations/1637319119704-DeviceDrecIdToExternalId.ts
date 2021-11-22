import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceDrecIdToExternalId1637319119704
  implements MigrationInterface
{
  name = 'DeviceDrecIdToExternalId1637319119704';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" RENAME COLUMN "drecID" TO "externalId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" RENAME CONSTRAINT "UQ_a93bf3af71fa160724c7ae04a2e" TO "UQ_d0f3fa81825b4840499a7bd07ab"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" RENAME CONSTRAINT "UQ_d0f3fa81825b4840499a7bd07ab" TO "UQ_a93bf3af71fa160724c7ae04a2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device" RENAME COLUMN "externalId" TO "drecID"`,
    );
  }
}
