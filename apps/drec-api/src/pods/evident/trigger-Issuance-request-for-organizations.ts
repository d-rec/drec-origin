import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EvidentSettings } from './evident-settings.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Device } from '../device/device.entity';
import { InfluxDB } from '@influxdata/influxdb-client';
import { EvidentService } from './evident.service';
import { Issuer } from './evident-issuer';
import { DateTime } from 'luxon';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

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
    private readonly evidentService: EvidentService,
  ) {}

  // @NonConcurrentCron(CronExpression.EVERY_DAY_AT_MIDNIGHT)

  private generateCsvContent(
    records: any[],
    externalId: string,
    startDate: string,
    endDate: string,
  ): string {
    const headers = ['timestamp', 'meter_id', 'read_value'];

    const csvRows = [headers.join(',')];

    records.forEach((record) => {
      // console.log("record",record)
      const row = [record._time || '', record._value, record.meter || 0];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Save CSV content to temporary file and return file path
   */
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

  /**
   * Clean up temporary CSV file
   */
  private async cleanupCsvFile(filePath: string): Promise<void> {
    try {
      const unlink = promisify(fs.unlink);
      await unlink(filePath);
      this.logger.log(`🗑️ Cleaned up temporary file: ${filePath}`);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to cleanup file ${filePath}:`, error);
    }
  }

  async handleCron() {
    this.logger.log('🔁 Starting daily certificate issuance check...');

    // Step 1: Fetch organizations that have evident settings
    const rawOrganizationIds = await this.evidentSettingsRepository
      .createQueryBuilder('es')
      .select('es.organization_id', 'organizationId')
      .getRawMany();

    const organizationIds = rawOrganizationIds.map((org) => org.organizationId);
    this.logger.log(
      `Found ${organizationIds.length} orgs with evident settings`,
    );

    // Process each organization
    for (const organizationId of organizationIds) {
      // Get all devices for this organization
      const devices = await this.deviceRepository.find({
        where: { organizationId: organizationId },
      });

      if (!devices?.length) continue;

      const externalIds = devices.map((device) => device.externalId);
      this.logger.log(
        `Found ${externalIds.length} devices for organization ${organizationId}`,
      );

      // step2: Get unsynced certificates for all devices at once
      const unsyncedCertificates = await this.certificateRepository.find({
        where: {
          externalId: In(externalIds),
          evidentSynced: false,
        },
      });

      if (!unsyncedCertificates || unsyncedCertificates.length === 0) continue;

      this.logger.log(
        `Found ${unsyncedCertificates.length} unsynced certificates`,
      );

      // const unsyncedExternalIds = unsyncedCertificates.map(
      //   (cert) => cert.externalId,
      // );

      // Step 5: Group certificates by device and compute date ranges
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
        // if (
        //   new Date(certificate_issuance_startdate).toISOString().replace('Z', '+00:00') <
        //   groupedByDevice[externalId].minStartDate
        // ) {
        //   groupedByDevice[externalId].minStartDate = new Date(
        //     certificate_issuance_startdate,
        //   ).toISOString().replace('Z', '+00:00');
        // }

        // // Update max end date
        // if (
        //   new Date(certificate_issuance_enddate).toISOString().replace('Z', '+00:00') >
        //   groupedByDevice[externalId].maxEndDate
        // ) {
        //   groupedByDevice[externalId].maxEndDate = new Date(
        //     certificate_issuance_enddate,
        //   ).toISOString().replace('Z', '+00:00');
        // }

        groupedByDevice[externalId].certificates.push(cert);
      }

      //     // Step 6: Fetch meter reads from InfluxDB and sum power for the certificate time range
      const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
      const token = process.env.INFLUXDB_TOKEN || 'your-token';
      const org = process.env.INFLUXDB_ORG || 'your-org';

      const influxDB = new InfluxDB({ url, token });
      const queryApi = influxDB.getQueryApi(org);
      for (const [externalId, deviceData] of Object.entries(groupedByDevice)) {
        const { minStartDate, maxEndDate } = deviceData;
        let csvFilePath: string | null = null;

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
        (groupedByDevice[externalId] as any).evidentDeviceId = evidentDeviceId;
        console.log('evidentDeviceId', evidentDeviceId);

        try {
          const records = await queryApi.collectRows(readsQuery);
          const totalReadValue = records.reduce(
            (sum: any, r: any) => sum + (r._value || 0),
            0,
          );
          (groupedByDevice[externalId] as any).productionVolume =
            totalReadValue;

          console.log(`✅ ${externalId} → totalRead: ${totalReadValue}`);

          // Generate CSV content from meter reads
          const csvContent = this.generateCsvContent(
            records,
            externalId,
            minStartDate,
            maxEndDate,
          );

          // Save CSV to temporary file
          csvFilePath = await this.saveCsvToFile(
            csvContent,
            externalId,
            minStartDate,
            maxEndDate,
          );
          console.log('csvContent', csvContent, 'csvFilePath', csvFilePath);
          this.logger.log(`📄 Generated CSV file: ${csvFilePath}`);
          // Get recipient account settings for this organization
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

          // Create payload for each device
          // startDate: DateTime.fromJSDate(new Date(minStartDate))
          // .toUTC()
          // .toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"),
          // endDate: DateTime.fromJSDate(new Date(maxEndDate))
          // .toUTC()
          // .toFormat("yyyy-MM-dd'T'HH:mm:ssZZ"),
          const payload: Issuer = {
            startDate: '2025-06-21T12:05:23+00:00',
            endDate: '2025-06-23T12:05:23+00:00',
            productionVolume: String(totalReadValue),
            notes: '',
            recipientAccount: `/accounts/${recipientAccount}`,
            code: evidentDeviceId,
            files: [csvFilePath],
            fuel: '/fuels/ES100',
            status: 'Draft',
          };
          console.log('payload', payload);
          if (evidentDeviceId) {
            await this.evidentService.registerIssuance(
              organizationId,
              evidentDeviceId,
              payload,
            );
          } else {
            console.error(
              `❌ No evidentDeviceId found for externalId ${externalId}`,
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

      this.logger.log('Processing data completed:', {
        unsyncedCertificates,
        groupedByDevice,
      });
    }
  }
}
