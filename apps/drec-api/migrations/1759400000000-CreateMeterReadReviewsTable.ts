import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMeterReadReviewsTable1759400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE meter_read_reviews (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL UNIQUE REFERENCES device(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        reviewer VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS meter_read_reviews;`);
  }
}
