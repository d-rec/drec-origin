import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCheckedAtToLateOngoingCycle1744811542775
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'device_lateongoing_certificate_cycle',
      new TableColumn({
        name: 'checked_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'device_lateongoing_certificate_cycle',
      'checked_at',
    );
  }
}
