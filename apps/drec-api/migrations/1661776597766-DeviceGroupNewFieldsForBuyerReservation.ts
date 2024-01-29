import {MigrationInterface, QueryRunner} from "typeorm";

export class DeviceGroupNewFieldsForBuyerReservation1661776597766 implements MigrationInterface {
    name = 'DeviceGroupNewFieldsForBuyerReservation1661776597766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_group" 
        ADD "frequency" character varying,
        ADD "reservationStartDate" TIMESTAMP WITH TIME ZONE,
        ADD "reservationEndDate" TIMESTAMP WITH TIME ZONE, 
        ADD "targetVolumeInMegaWattHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD "targetVolumeCertificateGenerationRequestedInMegaWattHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD "targetVolumeCertificateGenerationSucceededInMegaWattHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD "targetVolumeCertificateGenerationFailedInMegaWattHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD "authorityToExceed" boolean,
        ADD "leftoverReadsByCountryCode" json
        `);
          }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
    }

}
