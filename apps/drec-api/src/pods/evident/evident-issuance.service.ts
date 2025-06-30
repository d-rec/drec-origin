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
import FormData from 'form-data';
import { DateTime } from 'luxon';
import { EvidentSettingsService } from './evident-settings.service';

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

  async create(
    organizationId: number,
    code: string,
    issuance: EvidentIssuanceRequest,
  ): Promise<any> {
    try {
      const evidentInstance =
        await this.evidentService.getApiInstance(organizationId);

      const response = await evidentInstance.post('/issues', {
        device: `/devices/${code}`,
      });

      const profile =
        await this.evidentService.getRegistrantInfo(organizationId);
      const registrantId = profile.member.uid;
      await this.saveDetails(
        organizationId,
        response.data,
        registrantId,
        issuance,
      );

      return response.data;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw new BadRequestException(
        error.response?.data?.['hydra:description'],
      );
    }
  }

  async saveDetails(
    organizationId: number,
    data: unknown,
    registrantId: string,
    issuance: EvidentIssuanceRequest,
  ): Promise<any> {
    const evidentInstance =
      await this.evidentService.getApiInstance(organizationId);
    try {
      let uploadedFiles = [];

      if (issuance.files) {
        uploadedFiles = await this.uploadFiles(
          issuance.files,
          organizationId,
          registrantId,
        );
      }

      const formattedStartDate =
        issuance.startDate instanceof Date
          ? DateTime.fromJSDate(issuance.startDate).toFormat(
              "yyyy-MM-dd'T'HH:mm:ssZZ",
            )
          : DateTime.fromISO(issuance.startDate).toFormat(
              "yyyy-MM-dd'T'HH:mm:ssZZ",
            );

      const formattedEndDate =
        issuance.endDate instanceof Date
          ? DateTime.fromJSDate(issuance.endDate).toFormat(
              "yyyy-MM-dd'T'HH:mm:ssZZ",
            )
          : DateTime.fromISO(issuance.endDate).toFormat(
              "yyyy-MM-dd'T'HH:mm:ssZZ",
            );
      issuance.endDate instanceof Date
        ? DateTime.fromJSDate(issuance.endDate).toFormat(
            "yyyy-MM-dd'T'HH:mm:ssZZ",
          )
        : DateTime.fromISO(issuance.endDate).toFormat(
            "yyyy-MM-dd'T'HH:mm:ssZZ",
          );

      const details = await evidentInstance.post('/issue_details', {
        files: uploadedFiles,
        endDate: formattedEndDate,
        fuel: issuance.fuel,
        issue: data['@id'],
        notes: issuance.notes,
        productionVolume: issuance.productionVolume,
        recipientAccount: issuance.recipientAccount,
        startDate: formattedStartDate,
        status: EvidentIssuanceStatus.Draft,
      });
      return details;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw error;
    }
  }

  private async uploadFiles(
    files: string[],
    organizationId: number,
    registrantId: string,
  ): Promise<string[]> {
    const uploadedFileReferences: string[] = [];
    const filesToUpload = Array.isArray(files) ? files : [files];

    for (const filePath of filesToUpload) {
      const fileReference = await this.uploadFileToEvident(
        organizationId,
        registrantId,
        filePath,
      );
      await this.cleanupCsvFile(filePath);
      uploadedFileReferences.push(fileReference);
    }

    return uploadedFileReferences;
  }

  private async uploadFileToEvident(
    organizationId: number,
    registrantId: string,
    filePath: string,
  ): Promise<string> {
    try {
      const evidentInstance =
        await this.evidentService.getApiInstance(organizationId);

      const readFile = promisify(fs.readFile);
      const fileBuffer = await readFile(filePath);
      const fileName = filePath.split('/').pop();

      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'text/csv',
      });
      form.append('name', fileName);
      form.append('notes', '');
      form.append('userUid', registrantId);
      form.append('category', '');
      const response = await evidentInstance.post('/files', form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      this.logger.log(`📤 File uploaded successfully: ${fileName}`);
      return response.data['@id'];
    } catch (error) {
      this.logger.error('❌ Failed to upload file to Evident:', error);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async getCertificatesForIssuance(): Promise<void> {
    const certificates =
      await this.deviceService.getCertificatesForEvidentIssuance();
    for (const certificate of certificates) {
      const reads = await this.getReads(
        certificate.device,
        certificate.certificate_issuance_startdate,
        certificate.certificate_issuance_enddate,
      );
      const amount = certificates.reduce(
        (acc, cert) => acc + cert.readvalue_watthour,
        0,
      );
      const csvContent = await this.generateCsvContent(reads);
      const minStartDate = certificates
        .map((cert) => cert.certificate_issuance_startdate)
        .sort(
          (a: Date, b: Date) => new Date(a).getTime() - new Date(b).getTime(),
        )[0];
      const maxEndDate = certificates
        .map((cert) => cert.certificate_issuance_enddate)
        .sort(
          (a: Date, b: Date) => new Date(b).getTime() - new Date(a).getTime(),
        )[0];
      const recipientAccount =
        await this.evidentSettingsService.getRecipientAccount(
          certificates[0].device.organizationId,
        );

      const csvFilePath = await this.saveCsvToFile(
        csvContent,
        certificates[0].device.evidentDeviceId,
        minStartDate,
        maxEndDate,
      );

      const payload: EvidentIssuanceRequest = {
        startDate: minStartDate,
        endDate: maxEndDate,
        productionVolume: amount.toString(),
        notes: '',
        recipientAccount: `/accounts/${recipientAccount}`,
        code: certificates[0].device.evidentDeviceId,
        files: [csvFilePath],
        fuel: '/fuels/ES100',
        status: 'Draft',
      };

      await this.create(
        certificates[0].device.organizationId,
        certificates[0].device.evidentDeviceId,
        payload,
      );
    }
  }
  private async getReads(
    device: Device,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const historyReads = await this.readService.getHistoryReads(
      device.externalId,
      startDate,
      endDate,
    );

    const mappedHistoricalReads = historyReads.map((read) => ({
      startDate: read.readsStartDate,
      value: read.readsvalue,
      unit: read.unit,
      endDate: read.readsEndDate,
      deviceId: device.evidentDeviceId,
      drecDeviceId: device.externalId,
    }));
    const deviceCreatedAt = new Date(device.createdAt);

    if (deviceCreatedAt > endDate) return mappedHistoricalReads;

    const ongoingReads = await this.readService.getOngoingReads(
      device.externalId,
      {
        offset: 0,
        limit: 5000,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    );

    const minDate = startDate > deviceCreatedAt ? startDate : deviceCreatedAt;

    const mappedOngoingReads = ongoingReads.map((read, i) => {
      const _startDate = ongoingReads[i - 1]
        ? new Date(ongoingReads[i - 1]._time)
        : minDate;

      return {
        startDate: _startDate > new Date(read._time) ? startDate : _startDate,
        endDate: read._time,
        value: read._value,
        unit: 'Wh',
        deviceId: device.evidentDeviceId,
        drecDeviceId: device.externalId,
      };
    });

    return [...mappedOngoingReads, ...mappedHistoricalReads];
  }

  private generateCsvContent(reads: any[]): string {
    const headers = [
      'Device ID',
      'DREC Device ID',
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

    const formattedStartDate = DateTime.fromJSDate(
      new Date(startDate),
    ).toFormat('yyyy-MM-dd');
    const formattedEndDate = DateTime.fromJSDate(new Date(endDate)).toFormat(
      'yyyy-MM-dd',
    );

    const fileName = `meter-reads-${deviceId}-${formattedStartDate}-to-${formattedEndDate}.csv`;
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
}
