import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrateReadsFromInfluxDBToReadsServices1748439569729 implements MigrationInterface {
    name = 'MigrateReadsFromInfluxDBToReadsServices1748439569729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // All queries removed
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // All queries removed
    }
}