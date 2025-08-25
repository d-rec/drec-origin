import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { NonConcurrentCron } from '../../lib/cron';
import {
  DeviceGroupCertificatesAggregate,
  EvidentIssuanceRequest,
  EvidentIssuanceStatus,
} from '../../types/evident';
import { EnergyUnit } from '../../types/units';
import { convertToPowerUnit } from '../../utils/convert-to-power-units';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Device } from '../device/device.entity';
import { DeviceService } from '../device/device.service';
import { DocumentType } from '../document-uploads/entities/documents.entity';
import { ReadsService } from '../reads/reads.service';
import { EvidentSettingsService } from './evident-settings.service';
import { EvidentService } from './evident.service';
import { MailService } from '../../mail/mail.service';
import { OrganizationService } from '../organization/organization.service';
import { getEvidentNextIssuanceDate } from '../../lib/helpers/getEvidentNextIssuanceDate';
import EvidentDraftIssuanceRegistrationTemplate, {
  getEvidentDraftIssuanceRegistrationSubject,
} from './mail/evident-draft-issuance-registration.template';
import { DeviceGroupService } from '../device-group/device-group.service';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from '../device-group/check_certificate_issue_date_log_for_device_group.entity';
import { DeviceGroup } from '../device-group/device-group.entity';
import EvidentDeviceGroupIssuanceRegistrationTemplate, {
  getEvidentDeviceGroupIssuanceRegistrationSubject,
} from './mail/evident-device-group-issuance-registration.template';
import { EvidentSettings } from './evident-settings.entity';
import { GroupType } from '../../utils/enums/group-type.enum';

@Injectable()
export class EvidentIssuanceService {
  private readonly logger = new Logger(EvidentIssuanceService.name);
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID;

  constructor(
    private readonly evidentService: EvidentService,
    private readonly deviceService: DeviceService,
    private readonly readService: ReadsService,
    private readonly evidentSettingsService: EvidentSettingsService,
    private mailService: MailService,
    @Inject(forwardRef(() => OrganizationService))
    private readonly organizationService: OrganizationService,
    private readonly deviceGroupService: DeviceGroupService,
  ) {}

  @NonConcurrentCron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processIssuanceByFrequency(): Promise<void> {
    this.logger.verbose('Issuance request creation started');
    const organizationsSettings =
      await this.evidentSettingsService.getAllOrganizationLastIssuanceSyncedAt();

    for (const settings of organizationsSettings) {
      const nextIssuanceDate = getEvidentNextIssuanceDate(
        settings.lastIssuanceSyncedAt,
        settings.frequency,
      );

      if (nextIssuanceDate > new Date()) {
        continue;
      }

      try {
        await this.processIssuanceByOrganization(settings.organizationId);
      } catch (error) {
        this.logger.error(
          `Error processing organization ${settings.organizationId}: ${error.message}`,
        );
      }
    }
  }

  @NonConcurrentCron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDeviceGroupIssuanceFrequency(): Promise<void> {
    this.logger.verbose('Device group issuance request creation started');
    const organizationsSettings =
      await this.evidentSettingsService.getAllOrganizationLastIssuanceSyncedAt();
    for (const settings of organizationsSettings) {
      const nextIssuanceDate = getEvidentNextIssuanceDate(
        settings.lastIssuanceSyncedAt,
        settings.frequency,
      );
      if (nextIssuanceDate > new Date()) {
        continue;
      }
      this.logger.verbose(
        `Processing device group issuance for organization ${settings.organizationId}`,
      );

      try {
        await this.processIssuanceByDeviceGroup(
          settings.organizationId,
          settings,
        );
      } catch (error) {
        this.logger.error(
          `Error processing organization ${settings.organizationId}: ${error.message}`,
        );
      }
    }
  }

  @NonConcurrentCron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processSingleDevicePathWayIssuanceFrequency(): Promise<void> {
    this.logger.verbose(
      'Single device pathway issuance request creation started',
    );
    const organizationsSettings =
      await this.evidentSettingsService.getAllOrganizationLastIssuanceSyncedAt();
    for (const settings of organizationsSettings) {
      const nextIssuanceDate = getEvidentNextIssuanceDate(
        settings.lastIssuanceSyncedAt,
        settings.frequency,
      );
      if (nextIssuanceDate > new Date()) {
        continue;
      }
      this.logger.verbose(
        `Processing single device pathway issuance for organization ${settings.organizationId}`,
      );

      try {
        const deviceGroups = await this.deviceGroupService.getRegisteredEvident(
          settings.organizationId,
          GroupType.Single,
        );
        if (deviceGroups.length) {
          const certificates =
            await this.deviceService.getCertificatesBySinglePathWayForEvidentIssuance(
              deviceGroups.map((group) => group.id),
            );
          if (!certificates.length) {
            return;
          }
          for (const certificate of certificates) {
            await this.processCertificate(certificate);
          }
        }
      } catch (error) {
        this.logger.error(
          `Error processing organization ${settings.organizationId}: ${error.message}`,
        );
      }
    }
  }

  async processIssuanceByDeviceGroup(
    organizationId: number,
    settings: EvidentSettings,
  ): Promise<void> {
    const deviceGroups = await this.deviceGroupService.getRegisteredEvident(
      organizationId,
      GroupType.Multiple,
    );
    for (const deviceGroup of deviceGroups) {
      const certificates: CheckCertificateIssueDateLogForDeviceGroupEntity[] =
        await this.deviceGroupService.findCertificateLogs(deviceGroup.id);
      this.logger.verbose(
        `Found certificates for device group ${deviceGroup.id}: ${certificates.length}`,
      );

      if (!certificates?.length) {
        continue;
      }
      await this.processDeviceGroupCertificates(
        deviceGroup,
        settings,
        certificates,
      );
    }
  }

  async processIssuanceByOrganization(organizationId: number): Promise<void> {
    this.logger.verbose(
      `Fetching certificates for issuance for organization ${organizationId}`,
    );
    const certificates =
      await this.deviceService.getCertificatesForEvidentIssuance(
        organizationId,
      );
    for (const certificate of certificates) {
      await this.processCertificate(certificate);
    }
  }

  async create(device: Device, issuance: EvidentIssuanceRequest): Promise<any> {
    try {
      const evidentInstance = await this.evidentService.getApiInstance(
        device.organizationId,
      );

      const response = await evidentInstance.post('/issues', {
        device: `/devices/${device.evidentDeviceId}`,
      });
      const issuanceId = response.data['uid'];
      const { id: registrantId } = await this.evidentService.getRegistrantInfo(
        device.organizationId,
      );

      const details = await this.saveDetails(
        device,
        issuanceId,
        registrantId,
        issuance,
      );
      const organization =
        await this.organizationService.getLinkedMarketIntermediaryOrSelf(
          device.organizationId,
        );
      await this.mailService.send({
        to: organization.orgEmail,
        subject: getEvidentDraftIssuanceRegistrationSubject(device),
        template: EvidentDraftIssuanceRegistrationTemplate({
          device,
          organizationName: organization.name,
          issuance,
        }),
      });

      return {
        ...response.data,
        issuanceId,
        details,
      };
    } catch (error) {
      this.logger.error(
        'Error registering issuance:',
        error.response?.data ?? error.message,
      );
      throw error;
    }
  }

  async createDeviceGroupIssuance(
    deviceGroup: DeviceGroup,
    issuance: EvidentIssuanceRequest,
  ): Promise<any> {
    try {
      const evidentInstance = await this.evidentService.getApiInstance(
        deviceGroup.organizationId,
      );

      const response = await evidentInstance.post('/issues', {
        device: `/devices/${issuance.code}`,
      });
      const issuanceId = response.data['uid'];
      const { id: registrantId } = await this.evidentService.getRegistrantInfo(
        deviceGroup.organizationId,
      );

      const details = await this.saveDetails(
        deviceGroup,
        issuanceId,
        registrantId,
        issuance,
      );
      const organization =
        await this.organizationService.getLinkedMarketIntermediaryOrSelf(
          deviceGroup.organizationId,
        );

      await this.mailService.send({
        to: organization.orgEmail,
        subject: getEvidentDeviceGroupIssuanceRegistrationSubject(deviceGroup),
        template: EvidentDeviceGroupIssuanceRegistrationTemplate({
          deviceGroup,
          organizationName: organization.name,
          issuance,
        }),
      });
      return {
        ...response.data,
        issuanceId,
        details,
      };
    } catch (error) {
      this.logger.error(
        'Error registering issuance:',
        error.response?.data ?? error.message,
      );
      throw error;
    }
  }

  async saveDetails(
    device: Device | DeviceGroup,
    issuanceId: string,
    registrantId: string,
    issuance: EvidentIssuanceRequest,
  ): Promise<any> {
    const evidentInstance = await this.evidentService.getApiInstance(
      device.organizationId,
    );
    let uploadedFiles = [];

    if (issuance.files) {
      uploadedFiles = await this.evidentService.uploadFiles(
        device,
        issuance.files,
        registrantId,
      );
    }

    const format = "yyyy-MM-dd'T'HH:mm:ssZZ";

    const startDateFormatted = DateTime.fromISO(issuance.startDate).toFormat(
      format,
    );
    const endDateFormatted = DateTime.fromISO(issuance.endDate).toFormat(
      format,
    );

    const payload = {
      files: uploadedFiles,
      fuel: issuance.fuel,
      issue: `/issues/${issuanceId}`,
      notes: issuance.notes,
      productionVolume: issuance.productionVolume,
      recipientAccount: issuance.recipientAccount,
      startDate: startDateFormatted,
      endDate: endDateFormatted,
      status: EvidentIssuanceStatus.Draft,
    };
    return await evidentInstance.post('/issue_details', payload);
  }

  private async processCertificate(
    certificate: CheckCertificateIssueDateLogForDeviceEntity,
  ) {
    const startDate = certificate.certificate_issuance_startdate;
    const endDate = certificate.certificate_issuance_enddate;

    const { reads, ...file } = await this.generateReadsCSVFile(
      certificate.device,
      startDate,
      endDate,
    );

    const files = {
      [DocumentType.METERING_EVIDENCE]: [file as Express.Multer.File],
    };

    const { defaultTradingAccount } = await this.evidentSettingsService.find(
      certificate.device.organizationId,
    );

    const amount = reads.reduce((sum, read) => {
      return sum + (read.value || 0);
    }, 0);

    if (amount <= 0) {
      this.logger.warn(
        `No valid reads found for device ${certificate.device.externalId} between ${startDate.toISOString()} and ${endDate.toISOString()}. Skipping issuance.`,
      );
      return;
    }

    const productionVolume = convertToPowerUnit({
      value: amount,
      unit: EnergyUnit.Wh,
      targetUnit: EnergyUnit.MWh,
    });

    const payload: EvidentIssuanceRequest = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      productionVolume: productionVolume.toString(),
      notes: JSON.stringify({
        'D-REC Device Id': certificate.device.externalId,
        'D-REC Token': certificate.certificateTransactionUID,
      }),
      recipientAccount: `/accounts/${defaultTradingAccount}`,
      code: certificate.device.evidentDeviceId,
      files,
      fuel: '/fuels/ES100',
      status: EvidentIssuanceStatus.Draft,
    };

    const { issuanceId } = await this.create(certificate.device, payload);

    await this.deviceService.updateCertificateLogEvidentDetails(
      certificate.id,
      issuanceId,
      EvidentIssuanceStatus.Draft,
    );

    await this.evidentSettingsService.updateLastIssuanceSyncedAt(
      certificate.device.organizationId,
    );
  }

  private async processDeviceGroupCertificates(
    deviceGroup: DeviceGroup,
    settings: EvidentSettings,
    certificates: CheckCertificateIssueDateLogForDeviceGroupEntity[],
  ) {
    const amount = certificates.reduce(
      (acc, certificate) => acc + certificate.readvalue_watthour,
      0,
    );

    const minStartDate = new Date(
      Math.min(
        ...certificates.map((c) => c.certificate_issuance_startdate.getTime()),
      ),
    );
    const maxEndDate = new Date(
      Math.max(
        ...certificates.map((c) => c.certificate_issuance_enddate.getTime()),
      ),
    );

    const { defaultTradingAccount } = settings;

    if (amount <= 0) {
      this.logger.warn(
        `No valid reads found for device group ${deviceGroup.name} between ${minStartDate.toISOString()} and ${maxEndDate.toISOString()}. Skipping issuance.`,
      );
      return;
    }

    const deviceCertificates =
      await this.deviceService.getCertificatesByGroupForEvidentIssuance(
        deviceGroup.id,
        certificates.map((c) => c.certificateTransactionUID),
      );

    const { ...file } = await this.generateGroupedDeviceProductionCSVFile(
      deviceCertificates,
      deviceGroup,
    );

    const files = {
      [DocumentType.DEVICE_GROUP_CERTIFICATES]: [file as Express.Multer.File],
    };

    const productionVolume = convertToPowerUnit({
      value: amount,
      unit: EnergyUnit.Wh,
      targetUnit: EnergyUnit.MWh,
    });

    const payload: EvidentIssuanceRequest = {
      startDate: minStartDate.toISOString(),
      endDate: maxEndDate.toISOString(),
      productionVolume: productionVolume.toString(),
      notes: JSON.stringify({
        'D-REC Device Group Id': deviceGroup.id,
        'D-REC Tokens': certificates.map((c) => c.certificateTransactionUID),
      }),
      recipientAccount: `/accounts/${defaultTradingAccount}`,
      code: deviceGroup.evidentGroupId,
      files,
      fuel: '/fuels/ES100',
      status: EvidentIssuanceStatus.Draft,
    };

    const { issuanceId } = await this.createDeviceGroupIssuance(
      deviceGroup,
      payload,
    );

    await this.deviceGroupService.updateCertificatesEvidentIssuance(
      certificates.map((c) => c.id),
      issuanceId,
      EvidentIssuanceStatus.Draft,
    );

    await this.evidentSettingsService.updateLastIssuanceSyncedAt(
      deviceGroup.organizationId,
    );
  }

  private async generateReadsCSVFile(
    device: Device,
    startDate: Date,
    endDate: Date,
  ) {
    const reads = await this.readService.findAll(device, startDate, endDate);
    const headers = [
      'Device ID',
      'D-REC Device ID',
      'startDate',
      'endDate',
      'value',
      'unit',
    ];
    const csvRows = [headers.join(',')];

    reads.forEach((record) => {
      const row = [
        record.deviceId,
        record.drecDeviceId,
        record.startDate,
        record.endDate,
        record.value,
        record.unit,
      ];
      csvRows.push(row.join(','));
    });

    const content = csvRows.join('\n');

    const fileName = `meter-reads-${device.evidentDeviceId}-${startDate.toISOString()}-to-${endDate.toISOString()}.csv`;

    return {
      originalname: fileName,
      filename: fileName,
      mimetype: 'text/csv',
      buffer: Buffer.from(content, 'utf8'),
      reads,
    };
  }

  private async generateGroupedDeviceProductionCSVFile(
    certificates: DeviceGroupCertificatesAggregate[],
    deviceGroup: DeviceGroup,
  ) {
    const headers = [
      'InverterID',
      'Inverter Brand Name',
      'Installation Name',
      'Issuer Organisation',
      'Fuel Code',
      'Technology Code',
      'Capacity',
      'Commissioning Date',
      'OwnersDecStartDate',
      'OwnersDecEndDate',
      'Installation State Province',
      'Installation PostCode',
      'Country',
      'Domestic',
      'Latitude',
      'Longitude',
      'Supported',
      'Period Production StartDate',
      'Period Production EndDate',
      'Production Volume',
      'Data Verifier Evidence URL',
      'Notes',
      'Related Inverter IDs',
    ];

    const csvRows = [headers.join(',')];

    certificates.forEach((record) => {
      const row = [
        record.device.serialNumber,
        record.device.dataSourceBrand,
        deviceGroup.name,
        this.issuerId,
        record.device.fuelCode,
        record.device.deviceTypeCode,
        record.device.capacity,
        record.device.commissioningDate,
        '',
        '',
        record.device.stateProvince,
        record.device.postcode,
        record.device.countryCode,
        true,
        record.device.latitude,
        record.device.longitude,
        true,
        record.min_start_date,
        record.max_end_date,
        record.amount,
        '',
        JSON.stringify({
          'D-REC Device Group Id': deviceGroup.evidentGroupId,
        }),
        '',
      ];
      csvRows.push(row.join(','));
    });

    const content = csvRows.join('\n');

    const fileName = `group-devices-certificates-${deviceGroup.evidentGroupId}}.csv`;

    return {
      originalname: fileName,
      filename: fileName,
      mimetype: 'text/csv',
      buffer: Buffer.from(content, 'utf8'),
      certificates: certificates.map((c) => c.device),
    } as unknown as Express.Multer.File;
  }
}
