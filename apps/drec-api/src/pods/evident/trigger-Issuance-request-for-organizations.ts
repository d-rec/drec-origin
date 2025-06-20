import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron'; // adjust path if different
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EvidentSettings } from './evident-settings.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Device } from '../device/device.entity';
import { ReadsService } from '../reads/reads.service';
import { InfluxDB } from '@influxdata/influxdb-client';
import { EvidentService } from './evident.service';
import { Issuer } from './evident-issuer';

@Injectable()
export class TrrigerIssuanceRequestForOrganizationsService {
  private readonly logger = new Logger(
    TrrigerIssuanceRequestForOrganizationsService.name,
  );
  // private minStartDate: Date | null = null;
  // private maxEndDate: Date | null = null;
  // private unsyncedCertificates:any[] =null;

  constructor(
    @InjectRepository(EvidentSettings)
    private readonly evidentSettingsRepository: Repository<EvidentSettings>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly certificateRepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    private readonly evidentService: EvidentService,
  ) {}

  @NonConcurrentCron(CronExpression.EVERY_DAY_AT_MIDNIGHT)

  //     // Step 1: Fetch orgs with evident settings
  //     // Step 2: Get unsynced certificates
  //     // Step 3: Group by device
  //     // Step 4: Create draft issuance requests
  //     // Step 5: Sum power, generate CSV
  //     // Step 6: Submit to Evident
  async handleCron() {
    this.logger.log('🔁 Starting daily certificate issuance check...');

    // Step 1: Fetch organizations that have evident settings
    const organizationIds = await this.evidentSettingsRepository
      .createQueryBuilder('es')
      .select('es.organization_id', 'organizationId')
      .getRawMany();

    console.log(organizationIds);

    this.logger.log(
      `Found ${organizationIds.length} orgs with evident settings`,
    );

    for (const organizationId of organizationIds) {
      const externalIds = await this.deviceRepository.find({
        where: {
          organizationId: organizationId,
        },
        select: ['externalId'],
      });
      console.log(externalIds);
      //     // Step 2: Get unsynced certificates

      for (const externalIdObj of externalIds) {
        const unsyncedCertificates = await this.certificateRepository.find({
          where: {
            externalId: externalIdObj.externalId,
            evident_synced: false,
          },
        });
        const evidentDevice = await this.deviceRepository.findOne({
          where: { externalId: externalIdObj.externalId },
        });
        const evidentDeviceId = evidentDevice.evidentDeviceId;
        if (unsyncedCertificates.length > 0) {
          this.logger.log(
            `📄 Org ${organizationId} has ${unsyncedCertificates.length} unsynced certificates`,
          );
        }

        //     // Step 3: Group certificates  per device
        // AddGroupDTO form device group
        const groupedByDevice: Record<string, any[]> = {};

        for (const cert of unsyncedCertificates) {
          const { externalId, ...certWithoutExternalId } = cert;
          if (!groupedByDevice[externalId]) {
            groupedByDevice[externalId] = [];
          }
          groupedByDevice[externalId].push(certWithoutExternalId);
        }

        Object.entries(groupedByDevice).forEach(([deviceId, certs]) => {
          this.logger.log(
            `📦 Device ${deviceId} has ${certs.length} unsynced certificate(s)`,
          );
        });

        //     // Step 5: get the minimum start date and their maximum end date as the dates to be used while creating the issuance request.Sum power, generate CSV

        // Iterate over each device group
        for (const [externalId, certs] of Object.entries(groupedByDevice)) {
          // Extract certificate IDs
          const certificateIds = certs.map((c) => c.id);

          // Fetch full certificates from repository
          const fullCertificates = await this.certificateRepository.find({
            where: {
              id: In(certificateIds),
            },
          });

          if (!fullCertificates.length) continue;

          // Compute min start date and max end date
          const minStartDate = new Date(
            Math.min(
              ...fullCertificates.map((c) =>
                c.certificate_issuance_startdate.getTime(),
              ),
            ),
          );
          const maxEndDate = new Date(
            Math.max(
              ...fullCertificates.map((c) =>
                c.certificate_issuance_enddate.getTime(),
              ),
            ),
          );

          // Log for debugging
          this.logger.log(
            `📦 Device ${externalId} has ${fullCertificates.length} certificate(s) from ${minStartDate.toISOString()} to ${maxEndDate.toISOString()}`,
          );

          // Sum   reads power power
          // The amount of power generated on evident should be set as the total readings of all meter reads related to those certificates

          // for (const certificate of this.unsyncedCertificates) {
          const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
          const token = process.env.INFLUXDB_TOKEN || 'your-token';
          const org = process.env.INFLUXDB_ORG || 'your-org';

          const influxDB = new InfluxDB({ url, token });
          const queryApi = influxDB.getQueryApi(org);
          const readsQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
              |> range(start: -1d)
              |> filter(fn: (r) => r._measurement == "read" and r.meter == "${externalId}" and r._field == "read")
              |> drop(columns: ["_start", "_stop"])`;

          // Assuming you have queryApi from InfluxDB client set up
          const records = await queryApi.collectRows(readsQuery);

          // Sum all the _value fields from the fetched records
          const productionVolume = records.reduce(
            (sum: number, record: any) => sum + Number(record.value),
            0,
          );
          const recipientAccountSettings =
            await this.evidentSettingsRepository.findOne({
              where: {
                organizationId: organizationId,
              },
            });
          const recipientAccount =
            recipientAccountSettings.defaultTradingAccount;
          const payload: Issuer = {
            startDate: minStartDate,
            endDate: maxEndDate,
            productionVolume: Number(productionVolume), // ensure it's numeric
            notes: '',
            recipientAccount,
          };
          await this.evidentService.registeIssuance(
            organizationId,
            evidentDeviceId,
            payload,
          );

          this.logger.log('Certificate check complete');
        }
      }
    }
  }
}
