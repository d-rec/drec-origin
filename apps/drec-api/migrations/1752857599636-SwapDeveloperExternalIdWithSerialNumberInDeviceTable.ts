import {MigrationInterface, QueryRunner} from "typeorm";

export class SwapDeveloperExternalIdWithSerialNumberInDeviceTable1752857599636 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE device
            SET "serial_number" = REPLACE("developerExternalId", ' ', '')
            WHERE "developerExternalId" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE device
            SET "developerExternalId" = "serial_number"
            WHERE "serial_number" IS NOT NULL
        `);

    }

}
