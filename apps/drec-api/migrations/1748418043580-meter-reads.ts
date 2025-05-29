import {MigrationInterface, QueryRunner} from "typeorm";

export class meterReads1748418043580 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "meter_reads" (
              id SERIAL PRIMARY KEY,
              external_id UUID NOT NULL UNIQUE,
              type VARCHAR NOT NULL,
              value DOUBLE PRECISION NOT NULL,
              unit VARCHAR NOT NULL,
              start_date TIMESTAMP NOT NULL,
              end_date TIMESTAMP NOT NULL,
              certified BOOLEAN DEFAULT FALSE,
              device_id INT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
              CONSTRAINT fk_device FOREIGN KEY (device_id) REFERENCES device(id) ON DELETE CASCADE
            );
          `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "meter_reads";`);
    }
}
