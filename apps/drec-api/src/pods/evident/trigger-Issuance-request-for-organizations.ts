import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron'; // adjust path if different
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidentSettings } from './evident-settings.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Device } from '../device/device.entity';

@Injectable()
export class TrrigerIssuanceRequestForOrganizationsService {
  private readonly logger = new Logger(TrrigerIssuanceRequestForOrganizationsService.name);

  constructor(
    @InjectRepository(EvidentSettings)
    private readonly evidentSettingsRepository: Repository<EvidentSettings>,
    @InjectRepository(Device) 
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly certificateRepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
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
  
  

    this.logger.log(`Found ${organizationIds.length} orgs with evident settings`);

    for (const organizationId of organizationIds) {
        const externalIds = await this.deviceRepository.find({
          where: {
            organizationId:organizationId,
          },
          select: ['externalId'],
        });
        console.log(externalIds);
        //     // Step 2: Get unsynced certificates

        for (const externalId of externalIds) {
        const unsyncedCertificates = await this.certificateRepository.find({
            where: {
              externalId: externalId,
              evident_synced: false,
            },
          });
          console.log(unsyncedCertificates);
          if (unsyncedCertificates.length > 0) {
            this.logger.log(
              `📄 Org ${organizationId} has ${unsyncedCertificates.length} unsynced certificates`,
            );
          }
        // }

        //     // Step 3: Group by device
        // AddGroupDTO form device group
        const groupedByDevice = new Map<string, any[]>();

        for (const cert of unsyncedCertificates) {
          const deviceId = cert.externalId; 
          if (!groupedByDevice.has(deviceId)) {
            groupedByDevice.set(deviceId, []);
          }
          groupedByDevice.get(deviceId)?.push(cert);
        }
      
        groupedByDevice.forEach((certs, deviceId) => {
          this.logger.log(
            `📦 Device ${deviceId} has ${certs.length} unsynced certificate(s)`,
          );
        });

    this.logger.log('Certificate check complete');
  }}
}}
