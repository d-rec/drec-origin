import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Device } from '../device/device.entity';
import { DeviceService } from '../device/device.service';
import { InjectQueue } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';
import { Queue } from 'bull';
import { getCountryCodeAlpha2 } from '../../utils/get-country-code-alpha-2';
import { DocumentType } from '../document-uploads/entities/documents.entity';
import { convertToPowerUnit } from '../../utils/convert-to-power-units';
import {
  EvidentDeviceDetailsPayload,
  EvidentRegistrationStatus,
} from '../../types/evident';
import { EvidentService } from './evident.service';
import { EnergyUnit } from 'src/types/units';

@Injectable()
export class EvidentDeviceService {
  private readonly logger = new Logger(EvidentDeviceService.name);
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;

  constructor(
    @InjectQueue(Queues.EvidentDeviceRegistration)
    private readonly evidentDeviceRegistrationQueue: Queue,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    private readonly evidentService: EvidentService,
  ) {}

  async fetchDevices(organizationId: number): Promise<any> {
    const evidentApiInstance =
      await this.evidentService.getApiInstance(organizationId);
    const response = await evidentApiInstance.get('/devices');
    return response.data;
  }

  async registerDevice(
    device: Device,
    files: Record<string, Express.Multer.File[]>,
  ): Promise<any> {
    try {
      const evidentApiInstance = await this.evidentService.getApiInstance(
        device.organizationId,
      );
      const response = await evidentApiInstance.post('/devices', {
        name: device.projectName,
        fuel: `/fuels/${device.fuelCode}`,
      });
      device.evidentDeviceId = response.data.code;
      await this.saveDeviceDetails(device, files);
      return response.data;
    } catch (error) {
      this.logger.error('Error registering device:', error.message);
      throw error;
    }
  }

  async saveDeviceDetails(
    device: Device,
    files: Record<string, Express.Multer.File[]>,
  ): Promise<string> {
    const evidentApiInstance = await this.evidentService.getApiInstance(
      device.organizationId,
    );
    const user = await this.evidentService.getRegistrantInfo(
      device.organizationId,
    );
    const uploadedFiles = await this.uploadFiles(
      device,
      files,
      user.member.uid,
    );

    const payload = this.generateDeviceDetailsPayload(
      device,
      user.member.organisation.uid,
      uploadedFiles,
    );

    await evidentApiInstance.post('/device_details', payload);

    await this.deviceService.updateEvidentInfo(
      device.externalId,
      device.evidentDeviceId,
      EvidentRegistrationStatus.Draft,
    );

    if (device.capacity <= 250) {
      await this.submitDeviceForReview(device, payload);
    }

    return payload;
  }

  async submitDeviceForReview(
    device: Device,
    payload: EvidentDeviceDetailsPayload,
  ): Promise<EvidentDeviceDetailsPayload> {
    this.logger.verbose('Within device status update');
    const evidentApiInstance = await this.evidentService.getApiInstance(
      device.organizationId,
    );
    payload.status = EvidentRegistrationStatus.Submitted;
    await evidentApiInstance.post('/device_details', payload);

    await this.deviceService.updateEvidentInfo(
      device.externalId,
      device.evidentDeviceId,
      EvidentRegistrationStatus.Submitted,
    );

    return payload;
  }

  async queueDeviceRegistration(
    device: Device,
    files: {
      [DocumentType.FORM_SF_02]: Express.Multer.File[];
      [DocumentType.SF_02C]: Express.Multer.File[];
      [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
      [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
      [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
    },
  ): Promise<void> {
    await this.evidentDeviceRegistrationQueue.add({
      device,
      files,
    });
  }

  async uploadFiles(
    device: Device,
    files: Record<string, Express.Multer.File[]>,
    registrantId: string,
  ): Promise<string[]> {
    const filesToUpload = [];
    for (const [documentType, fileArray] of Object.entries(files)) {
      if (!Array.isArray(fileArray)) continue;
      for (const file of fileArray) {
        filesToUpload.push({
          file,
          documentType: documentType as DocumentType,
        });
      }
    }
    const uploadedFiles = await Promise.all(
      filesToUpload.map(({ file, documentType }) =>
        this.evidentService.uploadFile(
          device,
          registrantId,
          file,
          this.getNotes(device),
          documentType,
        ),
      ),
    );
    return uploadedFiles
      .filter((result) => result.success && result.fileId)
      .map((result) => result.fileId);
  }

  private generateDeviceDetailsPayload(
    device: Device,
    registrantId: string,
    files: string[],
  ): any {
    const alpha2CountryCode = getCountryCodeAlpha2(device.countryCode);
    const convertCapacityToMwh = convertToPowerUnit({
      value: device.capacity,
      unit: EnergyUnit.kWh,
      targetUnit: EnergyUnit.MWh,
    });
    return {
      deviceType: `/device_types/${device.deviceTypeCode}`,
      fuel: `/fuels/${device.fuelCode}`,
      device: `/devices/${device.evidentDeviceId}`,
      registrant: `/organisations/${registrantId}`,
      issuer: `/organisations/${this.issuerId}`,
      name: device.projectName,
      capacity: convertCapacityToMwh.toString(),
      supported: true,
      latitude: device.latitude,
      longitude: device.longitude,
      registrationDate: new Date(device.createdAt).toISOString().split('T')[0],
      commissioningDate: device.commissioningDate.split('T')[0],
      status: EvidentRegistrationStatus.Draft,
      active: true,
      address1: device.address,
      postcode: device.postcode,
      stateProvince: device.stateProvince,
      country: `/countries/${alpha2CountryCode}`,
      notes: this.getNotes(device),
      files,
    };
  }

  private getNotes(device: Device): string {
    return JSON.stringify({ 'D-REC ID': device.externalId });
  }

  async getStatus(organizationId: number, code: string): Promise<string> {
    const evidentInstance =
      await this.evidentService.getApiInstance(organizationId);
    const response = await evidentInstance.get(`/devices/${code}`);
    return response.data.latestDeviceDetails.status;
  }
}
