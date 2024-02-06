import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class alterDevicesAndCreateIrecDevicesInfo1690172985738 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.createTable(
      new Table({
        name: 'irec_devices_information',
        columns: [
          {
            name: 'id',
            type: 'serial', // This will create an auto-incrementing integer column
            isPrimary: true,
          },
          {
            name: 'IREC_id',
            type: 'varchar', // You can use 'string' as well; 'varchar' is equivalent to 'string' in PostgreSQL
          },
          {
            name: 'event',
            type: 'varchar',
          },
          {
            name: 'request',
            type: 'json',
          },
          {
            name: 'responses',
            type: 'json', // The column for storing JSON data
          },
          {
            name: 'createdAt',
            type: 'timestamp', // You can use 'timestamp' for the date and time
            default: 'now()', // Set the default value to the current timestamp
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'current_timestamp()', // Set the value to the current timestamp on update
          },

        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'irec_error_log_information',
        columns: [
          {
            name: 'id',
            type: 'serial', // This will create an auto-incrementing integer column
            isPrimary: true,
          },
          {
            name: 'event',
            type: 'varchar',
          },
          {
            name: 'request',
            type: 'json',
          },
          {
            name: 'error_log_responses',
            type: 'json', // The column for storing JSON data
          },
          {
            name: 'createdAt',
            type: 'timestamp', // You can use 'timestamp' for the date and time
            default: 'now()', // Set the default value to the current timestamp
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'current_timestamp()', // Set the value to the current timestamp on update
          },
        ],
      }),
    );

    await queryRunner.addColumn(
      'device',
      new TableColumn({
        name: 'IREC_Status',
        type: 'varchar', // You can use 'string' as well; 'varchar' is equivalent to 'string' in PostgreSQL
        isNullable: true,
        default: "'NotRegistered'",// Set this to false if the column should not allow null values
      }),
    );

    await queryRunner.addColumn(
      'device',
      new TableColumn({
        name: 'IREC_ID',
        type: 'varchar', // You can use 'string' as well; 'varchar' is equivalent to 'string' in PostgreSQL
        isNullable: true, // Set this to false if the column should not allow null values
      }),
    );



  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reversing the migration (rollback)
    await queryRunner.dropTable('irec_devices_information');
    await queryRunner.dropTable('irec_error_log_information');
    // await queryRunner.dropColumn('devices', 'IREC_ID');
    // await queryRunner.dropColumn('devices', 'IREC_Status');
  }
}
