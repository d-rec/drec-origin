import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EvidentSettings } from './evident-settings.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Device } from '../device/device.entity';
import { InfluxDB } from '@influxdata/influxdb-client';
import { Issuer } from './evident-issuer';
import { DateTime } from 'luxon';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ReadsService } from '../reads/reads.service';
import {
  AccumulationType,
  FilterNoOffLimit,
  ReadType,
} from '../reads/dto/filter-no-off-limit.dto';
import { EvidentIssuanceService } from './evident-issuance-service';

@Injectable()
export class TrrigerIssuanceRequestForOrganizationsService {
  private readonly logger = new Logger(
    TrrigerIssuanceRequestForOrganizationsService.name,
  );

  constructor(
    @InjectRepository(EvidentSettings)
    private readonly evidentSettingsRepository: Repository<EvidentSettings>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly certificateRepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    private readonly evidentissunaceService: EvidentIssuanceService,
    private readsService: ReadsService,
  ) {}

  private generateCsvContent(csvData: any): string {
    const headers = ['startdate', 'enddate', 'read_value'];
    const csvRows = [headers.join(',')];

    const allReads = [
      ...(csvData.historyread || []),
      ...(csvData.ongoing || []),
    ];

    allReads.forEach((record) => {
      const row = [record.startdate, record.enddate, record.value];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private async saveCsvToFile(
    csvContent: string,
    externalId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp', 'csv-exports');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `meter-reads-${externalId}-${DateTime.fromISO(startDate).toFormat('yyyy-MM-dd')}-to-${DateTime.fromISO(endDate).toFormat('yyyy-MM-dd')}.csv`;
    const filePath = path.join(tempDir, fileName);

    const writeFile = promisify(fs.writeFile);
    await writeFile(filePath, csvContent, 'utf8');

    return filePath;
  }

  // Clean up temporary CSV file

  private async cleanupCsvFile(filePath: string): Promise<void> {
    const unlink = promisify(fs.unlink);
    await unlink(filePath);
    this.logger.log(`🗑️ Cleaned up temporary file: ${filePath}`);
  }

  // @NonConcurrentCron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron():Promise<void> {
    this.logger.verbose('🔁 Starting daily certificate issuance check...');

    // Fetch organizations that have evident settings
    const rawOrganizationIds = await this.evidentSettingsRepository
      .createQueryBuilder('es')
      .select('es.organization_id', 'organizationId')
      .getRawMany();

    const organizationIds = rawOrganizationIds.map((org) => org.organizationId);

    for (const organizationId of organizationIds) {
      const devices = await this.deviceRepository.find({
        where: { organizationId: organizationId },
      });
      if (!devices?.length) continue;

      const externalIds = devices.map((device) => device.externalId);

      //  Get unsynced certificates for all devices external id at once
      const unsyncedCertificates = await this.certificateRepository.find({
        where: {
          externalId: In(externalIds),
          evidentSynced: false,
        },
      });
console.log("unsyncedCertificates",unsyncedCertificates)
      if (!unsyncedCertificates || unsyncedCertificates.length === 0) continue;

      this.logger.verbose(
        `Found ${unsyncedCertificates.length} unsynced certificates`,
      );

      // Group certificates by device and compute date ranges
      const groupedByDevice: Record<
        string,
        {
          certificates: any[];
          minStartDate: string;
          maxEndDate: string;
        }
      > = {};

      for (const cert of unsyncedCertificates) {
        const {
          externalId,
          certificate_issuance_startdate,
          certificate_issuance_enddate,
        } = cert;

        if (!groupedByDevice[externalId]) {
          groupedByDevice[externalId] = {
            certificates: [],
            minStartDate: DateTime.fromJSDate(
              new Date(certificate_issuance_startdate),
            )
              .toUTC()
              .toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"),
            maxEndDate: DateTime.fromJSDate(
              new Date(certificate_issuance_enddate),
            )
              .toUTC()
              .toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"),
          };
        }

        // Update min start date
        if (
          new Date(certificate_issuance_startdate)
            .toISOString()
            .replace('Z', '+00:00') < groupedByDevice[externalId].minStartDate
        ) {
          groupedByDevice[externalId].minStartDate = new Date(
            certificate_issuance_startdate,
          )
            .toISOString()
            .replace('Z', '+00:00');
        }

        // Update max end date
        if (
          new Date(certificate_issuance_enddate)
            .toISOString()
            .replace('Z', '+00:00') > groupedByDevice[externalId].maxEndDate
        ) {
          groupedByDevice[externalId].maxEndDate = new Date(
            certificate_issuance_enddate,
          )
            .toISOString()
            .replace('Z', '+00:00');
        }

        groupedByDevice[externalId].certificates.push(cert);
      }

      // Fetch meter reads from InfluxDB and sum power for the certificate time range
      const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
      const token = process.env.INFLUXDB_TOKEN || 'your-token';
      const org = process.env.INFLUXDB_ORG || 'your-org';

      const influxDB = new InfluxDB({ url, token });
      const queryApi = influxDB.getQueryApi(org);

      const successfullyProcessedCertificateIds: number[] = [];

      for (const [externalId, deviceData] of Object.entries(groupedByDevice)) {
        const { minStartDate, maxEndDate, certificates } = deviceData;
        let csvFilePath: string | null = null;
        try {
          const readsQuery = `
            from(bucket: "${process.env.INFLUXDB_BUCKET}")
              |> range(start: ${new Date(minStartDate).toISOString()}, stop: ${new Date(maxEndDate).toISOString()})
              |> filter(fn: (r) => 
                  r._measurement == "read" and 
                  r.meter == "${externalId}" and 
                  r._field == "read"
              )
              |> drop(columns: ["_start", "_stop"])
          `;

          const result = await this.deviceRepository
            .createQueryBuilder('device')
            .select('device.evidentDeviceId', 'evidentDeviceId')
            .where('device.externalId = :externalId', { externalId })
            .getRawOne();

          const evidentDeviceId = result?.evidentDeviceId;
          (groupedByDevice[externalId] as any).evidentDeviceId =
            evidentDeviceId;

          const records = await queryApi.collectRows(readsQuery);
          const totalReadValue = records.reduce(
            (sum: any, r: any) => sum + (r._value || 0),
            0,
          );
          (groupedByDevice[externalId] as any).productionVolume =
            totalReadValue;

          console.log(`✅ ${externalId} → totalRead: ${totalReadValue}`);

          // Generate CSV content from meter reads

          const filter: FilterNoOffLimit = {
            readType: ReadType.meterReads,
            start: new Date(minStartDate),
            end: new Date(maxEndDate),
            accumulationType: AccumulationType.monthly,
            limit: 100,
            offset: 0,
            organizationId: organizationId,
          };
          const pageNumber = 1;

          const csvData = await this.readsService.getAllRead(
            externalId,
            filter,
            result.createdAt,
            pageNumber,
          );

          const csvContent = this.generateCsvContent(csvData);

          // Save CSV to temporary file
          csvFilePath = await this.saveCsvToFile(
            csvContent,
            externalId,
            minStartDate,
            maxEndDate,
          );

          this.logger.log(`📄 Generated CSV file: ${csvFilePath}`);

          const recipientAccountSettings =
            await this.evidentSettingsRepository.findOne({
              where: {
                organizationId: organizationId,
              },
            });

          if (!recipientAccountSettings) {
            console.error(
              `❌ No recipient account settings found for organization ${organizationId}`,
            );
            continue;
          }

          const recipientAccount =
            recipientAccountSettings.defaultTradingAccount;

          const payload: Issuer = {
            startDate: '2025-06-25T00:00:00+00:00',
            endDate: '2025-06-25T23:59:59+00:00',
            productionVolume: '155',
            notes: '',
            recipientAccount: `/accounts/TKF8Q35B`,
            code: evidentDeviceId,
            files: [csvFilePath],
            fuel: '/fuels/ES100',
            status: 'Draft',
          };

          if (evidentDeviceId) {
            await this.evidentissunaceService.registerIssuance(
              organizationId,
              evidentDeviceId,
              payload,
            );

            certificates.forEach((cert) => {
              successfullyProcessedCertificateIds.push(cert.id);
            });

            this.logger.verbose(
              `✅ Successfully registered issuance for device ${externalId}`,
            );
          }
        } catch (error) {
          console.error(`❌ Error processing ${externalId}:`, error);
          throw error;
        } finally {
          // Clean up the temporary CSV file
          if (csvFilePath) {
            await this.cleanupCsvFile(csvFilePath);
          }
        }
      }

      await this.certificateRepository.update(
        { id: In(successfullyProcessedCertificateIds) },
        { evidentSynced: true },
      );
      this.logger.log(
        `Updated ${successfullyProcessedCertificateIds.length} certificates as synced`,
      );
            this.logger.log('Processing data completed:', {
          unsyncedCertificates,
          groupedByDevice,
      });
    }
  }
}
