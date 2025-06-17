import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Device } from '../device';
import { DeviceService } from '../device/device.service';
import { InjectQueue } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';
import { Queue } from 'bull';
import { getCountryCodeAlpha2 } from '../../utils/get-country-code-alpha-2';
import { DocumentType } from '../document-uploads/entities/documents.entity';
import FormData from 'form-data';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createEvidentAxiosInstance } from '../../lib/evident';
import { decrypt } from '../../utils/crypto';
import { EvidentSettings } from './evident-settings.entity';

enum EvidentRegistrationStatus {
  draft = 'Draft',
  submitted = 'Submitted',
  approved = 'Approved',
}

@Injectable()
export class EvidentService {
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;
  private email = process.env.IREC_EVIDENT_REGISTRANT_EMAIL || null;
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;
  private uploadedFiles = [];

  constructor(
    @InjectRepository(EvidentSettings)
    private readonly evidentSettingRepository: Repository<EvidentSettings>,
    @InjectQueue(Queues.EvidentDeviceRegistration)
    private readonly evidentDeviceRegistrationQueue: Queue,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  private async getEvidentInstance(organizationId: number) {
    const data = await this.evidentSettingRepository.findOne({
      where: { organizationId },
    });
    if (!data) return null;
    const apiKey = decrypt(data.apiKey);
    return createEvidentAxiosInstance({
      baseURL: this.apiUrl,
      apiKey,
      organizationId: organizationId.toString(),
    });
  }

  async fetchDevices(organizationId: number): Promise<any> {
    const evidentInstance = await this.getEvidentInstance(organizationId);
    const response = await evidentInstance.get('/devices');
    return response.data;
  }

  async getUserProfile(email: string, organizationId: number): Promise<any> {
    try {
      const evidentInstance = await this.getEvidentInstance(organizationId);
      const user = await evidentInstance.get(`/users?q=${email}`);
      return user.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // async updateDeviceStatus(device: Device, deviceCode: string): Promise<any> {
  //   try {
  //     const alpha2CountryCode = getCountryCodeAlpha2(device.countryCode);
  //     const response = await this.axiosInstance.post('/device_details', {
  //       deviceType: `/device_types/${device.deviceTypeCode}`,
  //       fuel: `/fuels/${device.fuelCode}`,
  //       device: `/devices/${deviceCode}`,
  //       registrant: `/organisations/${this.registrantId}`,
  //       issuer: `/organisations/${this.issuerId}`,
  //       name: device.projectName,
  //       capacity: device.capacity.toString(),
  //       supported: true,
  //       latitude: device.latitude,
  //       longitude: device.longitude,
  //       registrationDate: new Date().toISOString().split('T')[0],
  //       commissioningDate: device.commissioningDate.split('T')[0],
  //       expiryDate: new Date().toISOString().split('T')[0],
  //       status: EvidentRegistrationStatus.submitted,
  //       active: true,
  //       address1: device.address,
  //       postcode: device.postcode,
  //       stateProvince: device.stateProvince,
  //       country: `/countries/${alpha2CountryCode}`,
  //       notes: 'DREC_ID: 01JPQDGJC8D5CQSB',
  //       issuerNotes: 'Notes made by the Issuer',
  //       files: [],
  //     });
  //     if (response) {
  //       console.log(
  //         'Device status updated successfully:',
  //         EvidentRegistrationStatus.submitted,
  //       );
  //       return this.deviceService.updateDeviceEvidentInfo(
  //         device.externalId,
  //         response.data.code,
  //         EvidentRegistrationStatus.submitted,
  //       );
  //     }
  //     return deviceCode;
  //   } catch (error) {
  //     console.error('Error updating device status:', error);
  //     throw error;
  //   }
  // }
  async mapDeviceDocuments(
    organizationId: number,
    files: Record<string, Express.Multer.File[]>,
    userUid: string,
  ): Promise<void> {
    for (const [documentType, fileArray] of Object.entries(files)) {
      if (!Array.isArray(fileArray)) continue;
      for (const file of fileArray) {
        try {
          await this.uploadEvidentFiles(
            organizationId,
            userUid,
            file,
            documentType as DocumentType,
          );
        } catch (error) {
          console.log('Failed to upload a document during mapping', error);
        }
      }
    }
  }

  async uploadEvidentFiles(
    organizationId: number,
    userUid: string,
    file: Express.Multer.File,
    documentType: DocumentType,
  ): Promise<any> {
    try {
      const evidentInstance = await this.getEvidentInstance(organizationId);
      if (!evidentInstance) {
        throw new Error('Evident instance not found for organization');
      }
      if (!file) {
        throw new Error('No file provided');
      }

      const form = new FormData();
      let fileData: any;

      if (file.buffer) {
        fileData = Buffer.isBuffer(file.buffer)
          ? file.buffer
          : Buffer.from((file.buffer as { data: number[] }).data);
      } else if (file.path && typeof file.path === 'string') {
        fileData = fs.createReadStream(file.path);
      } else {
        throw new Error('File data not found (no buffer or path)');
      }

      form.append('file', fileData, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      form.append('name', file.originalname);
      form.append('notes', '');
      form.append('userUid', userUid);
      form.append('category', documentType);
      const uploadFile = await evidentInstance.post('/files', form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (uploadFile && uploadFile.data && uploadFile.data['@id']) {
        this.uploadedFiles.push(uploadFile.data['@id']);
      }

      return {
        success: true,
        data: uploadFile.data,
        fileId: uploadFile.data.id,
      };
    } catch (error) {
      console.error(
        'Failed to upload file:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        error:
          error.response?.data?.message || error.message || 'Upload failed',
      };
    }
  }

  async registerDeviceDetails(
    organizationId: number,
    device: Device,
    deviceCode: string,
    files: Record<string, Express.Multer.File[]>,
  ): Promise<any> {
    try {
      const evidentInstance = await this.getEvidentInstance(organizationId);
      this.uploadedFiles = [];
      const user = await this.getUserProfile(this.email, organizationId);
      const userMember = user['hydra:member'][0];
      const userUid = userMember.uid;
      const registrantId = userMember.organisation.uid;
      await this.mapDeviceDocuments(organizationId, files, userUid);
      const alpha2CountryCode = getCountryCodeAlpha2(device.countryCode);
      const deviceResponse = await evidentInstance.post('/device_details', {
        deviceType: `/device_types/${device.deviceTypeCode}`,
        fuel: `/fuels/${device.fuelCode}`,
        device: `/devices/${deviceCode}`,
        registrant: `/organisations/${registrantId}`,
        issuer: `/organisations/${this.issuerId}`,
        name: device.projectName,
        capacity: device.capacity.toString(),
        supported: true,
        latitude: device.latitude,
        longitude: device.longitude,
        registrationDate: new Date().toISOString().split('T')[0],
        commissioningDate: device.commissioningDate.split('T')[0],
        expiryDate: new Date().toISOString().split('T')[0],
        status: EvidentRegistrationStatus.draft,
        active: true,
        address1: device.address,
        postcode: device.postcode,
        stateProvince: device.stateProvince,
        country: `/countries/${alpha2CountryCode}`,
        notes: 'Notes made by the Issuer',
        issuerNotes: 'Notes made by the Issuer',
        files: this.uploadedFiles,
      });
      if (deviceResponse) {
        this.deviceService.updateDeviceEvidentInfo(
          device.externalId,
          deviceCode,
          EvidentRegistrationStatus.draft,
        );
      }
      // if (device.capacity > 250) {
      //   await this.updateDeviceStatus(device, deviceCode);
      // }
      return deviceCode;
    } catch (error) {
      console.error('Error registering device details:', error);
      throw error;
    }
  }
  //https://api-internal.sandbox.evident.dev/organisations/role?role=issuer&pagination=false

  async registerDevice(
    organizationId: number,
    device: Device,
    files: Record<string, Express.Multer.File[]>,
  ): Promise<any> {
    try {
      const evidentInstance = await this.getEvidentInstance(organizationId);
      if (!evidentInstance) {
        throw new Error('Evident instance not found for organization');
      }
      const response = await evidentInstance.post('/devices', {
        name: device.projectName,
        fuel: `/fuels/${device.fuelCode}`,
      });
      await this.registerDeviceDetails(
        organizationId,
        device,
        response.data.code,
        files,
      );
      return response.data;
    } catch (error) {
      console.error('Error registering device:', error.message);
      throw error;
    }
  }

  async registerDeviceQueue(
    organizationId: number,
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
      organizationId,
      device,
      files,
    });
  }
}
