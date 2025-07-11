import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { NonConcurrentCron } from '../../lib/cron';
import {
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
import { getEvidentNextIssuanceDate } from '../../lib/helpers/getEvidentNextIssuanceDate';

@Injectable()
export class EvidentIssuanceService {
  private readonly logger = new Logger(EvidentIssuanceService.name);

  constructor(
    private readonly evidentService: EvidentService,
    private readonly deviceService: DeviceService,
    private readonly readService: ReadsService,
    private readonly evidentSettingsService: EvidentSettingsService,
  ) {}

  // @NonConcurrentCron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @NonConcurrentCron('*/15 * * * * *')
  async processIssuanceByFrequency(): Promise<void> {
    this.logger.verbose('Issuance request creation started');
    console.log("hhhhhhhhhhhhhhhhhhhhhh started hhhhhhhhhhhhhhhhhh")
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
    device: Device,
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
}
