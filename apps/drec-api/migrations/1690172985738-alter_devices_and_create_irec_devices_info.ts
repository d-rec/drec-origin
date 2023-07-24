import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class alterDevicesAndCreateIrecDevicesInfo1690172985738 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.createTable(
        new Table({
          name: 'irec_devices_information',
          columns: [
            {
              name: 'IREC_id',
              type: 'varchar', // You can use 'string' as well; 'varchar' is equivalent to 'string' in PostgreSQL
              isPrimary: true,
            },
            {
              name: 'device_details',
              type: 'json', // The column for storing JSON data
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
        default:'NotRegistered'// Set this to false if the column should not allow null values
      }),
    );

    await queryRunner.addColumn(
      'devices',
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

    await queryRunner.dropColumn('devices', 'IREC_ID');
    await queryRunner.dropColumn('devices', 'IREC_Status');
  }
}
