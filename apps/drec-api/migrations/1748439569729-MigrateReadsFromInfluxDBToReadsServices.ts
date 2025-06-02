import { mapMeterReads } from "../src/lib/influx-db";
import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrateReadsFromInfluxDBToReadsServices1748439569729 implements MigrationInterface {
    name = 'MigrateReadsFromInfluxDBToReadsServices1748439569729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const readsArray = await mapMeterReads();
        if (readsArray.length > 0) {
            const getDevice = await queryRunner.query('SELECT * FROM public.device WHERE "externalId" = $1', [readsArray[0].externalId]);
            readsArray[0].startDate = getDevice && getDevice[0] ? getDevice[0].createdAt : Date.now().toString();
        }
        for (const read of readsArray) {
            const readsStartDate = read.startDate && !isNaN(new Date(read.startDate).getTime()) ? new Date(read.startDate) : null;
            const readsEndDate = read.endDate && !isNaN(new Date(read.endDate).getTime()) ? new Date(read.endDate) : null;
            const certificateIssuanceStartDate = read.certificateIssuanceStartDate && !isNaN(new Date(read.certificateIssuanceStartDate).getTime()) ? new Date(read.certificateIssuanceStartDate) : null;
            const certificateIssuanceEndDate = read.certificateIssuanceEndDate && !isNaN(new Date(read.certificateIssuanceEndDate).getTime()) ? new Date(read.certificateIssuanceEndDate) : null;
            await queryRunner.query(
                `INSERT INTO public.history_intermediate_meteread (
                    "createdAt", "updatedAt", "type", "unit", "readsvalue", "readsStartDate", "readsEndDate", "externalId", "groupId_certificate_issued_for", "certificate_issued", "issuer_certificate_id", "certificate_issuance_startdate", "certificate_issuance_enddate"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    new Date(read.createdAt),
                    new Date(read.updatedAt),
                    read.type,
                    read.unit,
                    read.value,
                    readsStartDate,
                    readsEndDate,
                    read.externalId,
                    read.groupIdCertificateIssuedFor,
                    read.certificateIssued,
                    read.IssuerCertificateId,
                    certificateIssuanceStartDate,
                    certificateIssuanceEndDate
                ]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM public.history_intermediate_meteread');
    }
}