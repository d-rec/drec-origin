import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeviceMreterReadTypeField1659507181646
  implements MigrationInterface
{
  name = 'DeviceMreterReadTypeField1659507181646';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device" ADD "meterReadtype" character varying `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
