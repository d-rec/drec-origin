import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateColumnvaluinNew1682659987637 implements MigrationInterface {
  name = 'updateColumnvaluinNew1682659987637';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE device_group
            SET "deviceIdsInt" = (
              SELECT array_agg(CAST(device_id_text AS bigint))
              FROM unnest(string_to_array("deviceIds", ',')) AS device_id_text
              WHERE device_id_text <> ''
            )
            WHERE "deviceIds" IS NOT NULL`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Since updating column values in a down migration can lead to data loss or inconsistency,
    // and reverting the update operation is complex and risky, leaving the down method empty.
  }
}
