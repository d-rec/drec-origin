import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDeveloperExternalId1759900800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" RENAME COLUMN "developerExternalId" TO "operatorExternalId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" RENAME COLUMN "operatorExternalId" TO "developerExternalId"`,
    );
  }
}
