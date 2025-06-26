import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  EvidentIssuanceRequest,
  EvidentIssuanceStatus,
} from '../../types/evident';
import { DeviceService } from '../device/device.service';
import { ReadsService } from '../reads/reads.service';
import { EvidentService } from './evident.service';
import { start } from 'repl';
import { Device } from '../device/device.entity';

@Injectable()
export class EvidentIssuanceService {
  private readonly logger = new Logger(EvidentIssuanceService.name);
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;

  constructor(
    private readonly evidentService: EvidentService,
    private readonly deviceService: DeviceService,
    private readonly readService: ReadsService,
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
      console.log('registered issueance succefully');
      const profile =
        await this.evidentService.getRegistrantInfo(organizationId);
      console.log('response', response.data);
      const registrantId = profile.member.uid;
      await this.saveDetails(
        organizationId,
        response.data,
        registrantId,
        issuance,
      );

      console.log('reached');
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
    data: any, // TODO: define the type
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
          issuance.notes,
        );
      }
      //   01JWE2T7514TEC15D68JSJSPC1
      const details = await evidentInstance.post('/issue_details', {
        files: [uploadedFiles],
        endDate: issuance.endDate,
        fuel: issuance.fuel,
        issue: data['@id'],
        notes: issuance.notes,
        productionVolume: issuance.productionVolume,
        recipientAccount: issuance.recipientAccount,
        startDate: issuance.startDate,
        status: EvidentIssuanceStatus.Draft,
      });
      console.log('details in success', details);
      return details;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw error;
    }
  }

  private async uploadFiles(
    files: Express.Multer.File[] | Express.Multer.File,
    organizationId: number,
    registrantId: string,
    notes = '',
  ): Promise<string[]> {
    const uploadedFileReferences: string[] = [];
    const filesToUpload = Array.isArray(files) ? files : [files];

    for (const filePath of filesToUpload) {
      const fileReference = await this.evidentService.uploadFile(
        { organizationId },
        registrantId,
        filePath,
        notes,
      );
      uploadedFileReferences.push(fileReference);
    }

    return uploadedFileReferences;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async getCertificatesForIssuance() {
    const certificates =
      await this.deviceService.getCertificatesForEvidentIssuance();
    for (const certificate of certificates) {
      const reads = await this.getReads(
        certificate.device,
        certificate.certificate_issuance_startdate,
        certificate.certificate_issuance_enddate,
      );
      const amount = reads.reduce((acc, read) => acc + read.value, 0);
      
      console.log('reads', reads.length);
    }
    console.log('certificates', certificates.length);
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
    return [...mappedHistoricalReads, ...mappedOngoingReads];
  }
}
