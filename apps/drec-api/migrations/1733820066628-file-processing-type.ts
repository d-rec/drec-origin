import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class fileProcessingType1733820066628 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'file_processing_jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'fileId',
            type: 'varchar',
          },
          {
            name: 'userId',
            type: 'integer',
          },
          {
            name: 'organizationId',
            type: 'integer',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Added', 'InProgress', 'Completed', 'Failed'],
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['MeterRead', 'DeviceCreation'],
          },
          {
            name: 'apiUserId',
            type: 'varchar',
            isNullable: true,
            default: null,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('file_processing_jobs');
  }
}
