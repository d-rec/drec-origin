import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddArchivedToLateOngoingCycle1744284686067
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'device_lateongoing_certificate_cycle',
      new TableColumn({
        name: 'archived_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'device_lateongoing_certificate_cycle',
      'archived_at',
    );
  }
}
