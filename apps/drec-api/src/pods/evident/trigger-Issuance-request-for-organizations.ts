import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron'; 
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

  //     // Step 1: Fetch orgs with evident settings
  //     // Step 2: Get unsynced certificates
  //     // Step 3: Group by device
  //     // Step 4: Create draft issuance requests
  //     // Step 5: Sum power, generate CSV
  //     // Step 6: Submit to Evident
  async handleCron(loggedInorganizationId) {
    this.logger.log('🔁 Starting daily certificate issuance check...');
  
    // Step 1: Fetch organizations that have evident settings
    const rawOrganizationIds = await this.evidentSettingsRepository
      .createQueryBuilder('es')
      .select('es.organization_id', 'organizationId')
      .getRawMany();
  
    const organizationIds = rawOrganizationIds.map((org) => org.organizationId);
    this.logger.log(`Found ${organizationIds.length} orgs with evident settings`);
    
    // Process each organization
    for (const organizationId of organizationIds) {
      this.logger.log(`Processing organization ${organizationId}`);
      
      // Get all devices for this organization
      const devices = await this.deviceRepository.find({
        where: { organizationId: organizationId },
      });
      
      if (devices.length === 0) {
        this.logger.log(`No devices found for organization ${organizationId}`);
        continue;
      }
      
      const externalIds = devices.map((device) => device.externalId);
      this.logger.log(`Found ${externalIds.length} devices for organization ${organizationId}`);
  
      // step2: Get unsynced certificates for all devices at once
      const unsyncedCertificates = await this.certificateRepository.find({
        where: {
          externalId: In(externalIds),
          evidentSynced: false,
        },
      });
  
      if (unsyncedCertificates.length === 0) {
        this.logger.log(`No unsynced certificates found for organization ${organizationId}`);
        continue;
      }
  
      this.logger.log(`Found ${unsyncedCertificates.length} unsynced certificates`);
      
      const unsyncedExternalIds = unsyncedCertificates.map(cert => cert.externalId);
      
      // Get evident device IDs for these certificates
      const evidentDevices = await this.deviceRepository.find({
        where: { externalId: In(unsyncedExternalIds) },
      });
      
      const evidentDeviceIds = evidentDevices.map(device => device.evidentDeviceId);
      // Step 5: Group certificates by device and compute date ranges
  const groupedByDevice: Record<string, {
    certificates: any[],
    minStartDate: Date,
    maxEndDate: Date,
  }> = {};

  for (const cert of unsyncedCertificates) {
    const { externalId, certificate_issuance_startdate, certificate_issuance_enddate, readvalue_watthour } = cert;

    if (!groupedByDevice[externalId]) {
      groupedByDevice[externalId] = {
        certificates: [],
        minStartDate: new Date(certificate_issuance_startdate),
        maxEndDate: new Date(certificate_issuance_enddate),
      };
    }

    // Update min start date
    if (new Date(certificate_issuance_startdate) < groupedByDevice[externalId].minStartDate) {
      groupedByDevice[externalId].minStartDate = new Date(certificate_issuance_startdate);
    }

    // Update max end date
    if (new Date(certificate_issuance_enddate) > groupedByDevice[externalId].maxEndDate) {
      groupedByDevice[externalId].maxEndDate = new Date(certificate_issuance_enddate);
    }

    groupedByDevice[externalId].certificates.push(cert);
  }
  
//     // Step 6: Fetch meter reads from InfluxDB and sum power for the certificate time range
// const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
// const token = process.env.INFLUXDB_TOKEN || 'your-token';
// const org = process.env.INFLUXDB_ORG || 'your-org';

// const influxDB = new InfluxDB({ url, token });
// const queryApi = influxDB.getQueryApi(org);

// for (const [externalId, deviceData] of Object.entries(groupedByDevice)) {
//   const { minStartDate, maxEndDate, certificates } = deviceData;

//   // Step 6a: Query InfluxDB for meter reads within the certificate's date range
//   const readsQuery = `
//     from(bucket: "${process.env.INFLUXDB_BUCKET}")
//       |> range(start: ${minStartDate.toISOString()}, stop: ${maxEndDate.toISOString()})
//       |> filter(fn: (r) => 
//           r._measurement == "read" and 
//           r.meter == "${externalId}" and 
//           r._field == "read"
//       )
//       |> drop(columns: ["_start", "_stop"])
//   `;

//   let productionVolume:any = 0;

//   try {
//     const records = await queryApi.collectRows(readsQuery);
    
//     // Sum all _value fields (meter readings in Wh)
//     productionVolume = records.reduce(
//       (sum: number, record: any) => sum + Number(record._value),
//       0,
//     );

//     this.logger.log(
//       `Total power generated for ${externalId} (${minStartDate} to ${maxEndDate}): ${productionVolume} Wh`,
//     );
//   } catch (error) {
//     this.logger.error(
//       `Failed to fetch InfluxDB data for ${externalId}:`,
//       error,
//     );
//     continue; // Skip this device if InfluxDB fails
//   }
// }  
      this.logger.log('Processing data:', {
        unsyncedCertificates,
        unsyncedExternalIds,
        evidentDeviceIds,
        groupedByDevice
      });
      
      // Rest of your processing logic...
    }
  }
}
