import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  EvidentIssuanceRequest,
  EvidentIssuanceStatus,
} from '../../types/evident';
import { DeviceService } from '../device/device.service';
import { ReadsService } from '../reads/reads.service';
import { EvidentService } from './evident.service';
import { Device } from '../device/device.entity';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { EvidentSettingsService } from './evident-settings.service';
import { convertToPowerUnit } from '../../utils/convert-to-power-units';
import { DocumentType } from '../document-uploads/entities/documents.entity';
import { EnergyUnit } from '../../types/units';
import { DateTime } from 'luxon';

@Injectable()
export class EvidentIssuanceService {
  private readonly logger = new Logger(EvidentIssuanceService.name);
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;

  constructor(
    private readonly evidentService: EvidentService,
    private readonly deviceService: DeviceService,
    private readonly readService: ReadsService,
    private readonly evidentSettingsService: EvidentSettingsService,
  ) {}

  async create(device: Device, issuance: EvidentIssuanceRequest): Promise<any> {
    try {
      const evidentInstance = await this.evidentService.getApiInstance(
        device.organizationId,
      );

      console.log('Creating issuance for device:', device.evidentDeviceId);

      const response = await evidentInstance.post('/issues', {
        device: `/devices/${device.evidentDeviceId}`,
      });

      console.log('Issuance created:', response.data);
      const issuanceId = response.data['@id'];
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
      console.error('Error registering issuance:', error.message);
      console.log('Error details:', error.response?.data);
      throw new BadRequestException(
        error.response?.data?.['hydra:description'],
      );
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
    try {
      let uploadedFiles = [];

      if (issuance.files) {
        uploadedFiles = await this.uploadFiles(
          device,
          issuance.files,
          registrantId,
        );
      }

      const format = 'yyyy-MM-dd\'T\'HH:mm:ssZZ';

      const startDateFormatted = DateTime.fromISO(issuance.startDate).toFormat(format);
      const endDateFormatted = DateTime.fromISO(issuance.endDate).toFormat(format);

      const payload =  {
        files: uploadedFiles,
        fuel: issuance.fuel,
        issue: issuanceId,
        notes: issuance.notes,
        productionVolume: issuance.productionVolume,
        recipientAccount: issuance.recipientAccount,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        status: EvidentIssuanceStatus.Draft,
      };

      console.log(payload);

      return await evidentInstance.post('/issue_details', payload);
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw error;
    }
  }

  private async uploadFiles(
    device: Device | { organizationId: number },
    files: string[],
    registrantId: string,
    notes = '',
  ): Promise<string[]> {
    const uploadedFileReferences: string[] = [];
    const filesToUpload = Array.isArray(files) ? files : [files];

    for (const filePath of filesToUpload) {
      const file = {
        path: filePath,
      } as Express.Multer.File;
      const fileReference = await this.evidentService.uploadFile(
        device,
        registrantId,
        file,
        notes,
        DocumentType.METERING_EVIDENCE,
      );
      await this.cleanupCsvFile(filePath);
      uploadedFileReferences.push(fileReference);
    }

    return uploadedFileReferences;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async getCertificatesForIssuance(): Promise<void> {
    const certificates =
      await this.deviceService.getCertificatesForEvidentIssuance();
    for (const certificate of certificates) {
      try {
        const startDate = certificate.certificate_issuance_startdate;
        const endDate = certificate.certificate_issuance_enddate;

        const reads = await this.readService.findAll(
          certificate.device,
          startDate,
          endDate,
        );

        const csvContent = this.generateCsvContent(reads);
        const evidentSettings = await this.evidentSettingsService.find(
          certificate.device.organizationId,
        );
        const recipientAccount = evidentSettings.defaultTradingAccount;
        const csvFilePath = await this.saveCsvToFile(
          csvContent,
          certificate.device.evidentDeviceId,
          startDate,
          endDate,
        );

        const amount = reads.reduce((sum, read) => {
          return sum + (read.value || 0);
        }, 0);
        console.log('Total amount of energy:', amount);
        const payload: EvidentIssuanceRequest = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          productionVolume: convertToPowerUnit({
            value: amount,
            unit: EnergyUnit.Wh,
            targetUnit: EnergyUnit.MWh,
          }),
          notes: '',
          recipientAccount: `/accounts/${recipientAccount}`,
          code: certificate.device.evidentDeviceId,
          files: [csvFilePath],
          fuel: '/fuels/ES100',
          status: 'Draft',
        };

        const { issuanceId } = await this.create(certificate.device, payload);

        await this.deviceService.updateCertificateLogEvidentDetails(
          certificate.id,
          issuanceId,
          EvidentIssuanceStatus.Draft,
        );
      } catch (error) {
        this.logger.error(
          `Error processing certificate for device ${certificate.device.id}: ${error.message}`,
        );
        throw error;
        // Optionally, you can log the error to a monitoring service or database
      }
    }
  }

  private generateCsvContent(reads: any[]): string {
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
    return csvRows.join('\n');
  }

  private async saveCsvToFile(
    csvContent: string,
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp', 'csv-exports');

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `meter-reads-${deviceId}-${startDate.toISOString()}-to-${endDate.toISOString()}.csv`;
    const filePath = path.join(tempDir, fileName);
    const writeFile = promisify(fs.writeFile);
    await writeFile(filePath, csvContent, 'utf8');
    return filePath;
  }

  private async cleanupCsvFile(filePath: string): Promise<void> {
    const unlink = promisify(fs.unlink);
    await unlink(filePath);
    this.logger.log(`🗑️ Cleaned up temporary file: ${filePath}`);
  }
}
