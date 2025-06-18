import { forwardRef, Inject, Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';
import axiosRetry from 'axios-retry';
import { Device } from '../device';
import { DeviceService } from '../device/device.service';
import { InjectQueue } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';
import { Queue } from 'bull';
import { getCountryCodeAlpha2 } from '../../utils/get-country-code-alpha-2';
import { DocumentType } from '../document-uploads/entities/documents.entity';
import FormData from 'form-data';
import * as fs from 'fs';

enum EvidentRegistrationStatus {
  draft = 'Draft',
  submitted = 'Submitted',
  approved = 'Approved',
}

@Injectable()
export class EvidentService {
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;
  private email = process.env.IREC_EVIDENT_REGISTRANT_EMAIL || null;
  private apiToken = process.env.IREC_EVIDENT_API_Token || null;
  private registrantId = process.env.IREC_EVIDENT_REGISTRANT_ID || null;
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private axiosInstance: AxiosInstance;
  private uploadedFiles = [];
  private userUid = '';
  constructor(
    @InjectQueue(Queues.EvidentDeviceRegistration)
    private readonly evidentDeviceRegistrationQueue: Queue,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {
    this.axiosInstance = axios.create({ baseURL: this.apiUrl });

    axiosRetry(this.axiosInstance, {
      retries: 1,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return error.response && error.response.status === 401;
      },
      onRetry: async (retryCount, error, requestConfig) => {
        if (error.response && error.response.status === 401) {
          const newToken = await this.getAuthToken();
          await this.storeAuthToken(newToken);
          requestConfig.headers = requestConfig.headers || {};
          requestConfig.headers['Authorization'] = `Bearer ${newToken}`;
        }
      },
    });

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        let token = await this.redis.get('evident_auth_token');
        if (!token) {
          token = await this.getAuthToken();
          await this.storeAuthToken(token);
        }
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  async getAuthToken(): Promise<string> {
    const response = await axios.post(`${this.apiUrl}/auth/token`, {
      email: this.email,
      token: this.apiToken,
    });
    this.storeAuthToken(response.data.token);
    return response.data.token;
  }

  async fetchDevices(): Promise<any> {
    const response = await this.axiosInstance.get('/devices');
    return response.data;
  }

  async getUserProfile(email: string): Promise<any> {
    try {
      const user = await this.axiosInstance.get(`/users?q=${email}`);
      const userMember =
        user.data['hydra:member'] && user.data['hydra:member'][0];
      const userId = userMember ? userMember.uid : null;
      this.userUid = userId;
      return user.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async storeAuthToken(token: string): Promise<void> {
    await this.redis.set('evident_auth_token', token, 'EX', 3600);
  }

  async updateDeviceStatus(device: Device, deviceCode: string): Promise<any> {
    try {
      const alpha2CountryCode = getCountryCodeAlpha2(device.countryCode);
      const response = await this.axiosInstance.post('/device_details', {
        deviceType: `/device_types/${device.deviceTypeCode}`,
        fuel: `/fuels/${device.fuelCode}`,
        device: `/devices/${deviceCode}`,
        registrant: `/organisations/${this.registrantId}`,
        issuer: `/organisations/${this.issuerId}`,
        name: device.projectName,
        capacity: device.capacity.toString(),
        supported: true,
        latitude: device.latitude,
        longitude: device.longitude,
        registrationDate: new Date().toISOString().split('T')[0],
        commissioningDate: device.commissioningDate.split('T')[0],
        expiryDate: new Date().toISOString().split('T')[0],
        status: EvidentRegistrationStatus.submitted,
        active: true,
        address1: device.address,
        postcode: device.postcode,
        stateProvince: device.stateProvince,
        country: `/countries/${alpha2CountryCode}`,
        notes: 'DREC_ID: 01JPQDGJC8D5CQSB',
        issuerNotes: 'Notes made by the Issuer',
        files: [],
      });
      if (response) {
        console.log(
          'Device status updated successfully:',
          EvidentRegistrationStatus.submitted,
        );
        return this.deviceService.updateDeviceEvidentInfo(
          device.externalId,
          response.data.code,
          EvidentRegistrationStatus.submitted,
        );
      }
      return deviceCode;
    } catch (error) {
      console.error('Error updating device status:', error);
      throw error;
    }
  }
  async mapDevices(
    files: Record<string, Express.Multer.File[]>,
  ): Promise<void> {
    for (const [documentType, fileArray] of Object.entries(files)) {
      if (!Array.isArray(fileArray)) continue;
      for (const file of fileArray) {
        try {
          await this.uploadEvidentFiles(file, documentType as DocumentType);
        } catch (error) {
          console.log('Failed to upload a document during mapping', error);
        }
      }
    }
  }

  async uploadEvidentFiles(
    file: Express.Multer.File,
    documentType: DocumentType,
  ): Promise<any> {
    try {
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
      form.append('notes', 'testing documents');
      form.append('userUid', this.userUid);
      form.append('category', documentType);

      const uploadFile = await this.axiosInstance.post('/files', form, {
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
    device: Device,
    deviceCode: string,
    files: Record<string, Express.Multer.File[]>,
  ): Promise<any> {
    try {
      this.uploadedFiles = [];
      await this.getUserProfile(this.email);
      await this.mapDevices(files);
      const alpha2CountryCode = getCountryCodeAlpha2(device.countryCode);
      const deviceResponse = await this.axiosInstance.post('/device_details', {
        deviceType: `/device_types/${device.deviceTypeCode}`,
        fuel: `/fuels/${device.fuelCode}`,
        device: `/devices/${deviceCode}`,
        registrant: `/organisations/${this.registrantId}`,
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
      if (device.capacity > 250) {
        await this.updateDeviceStatus(device, deviceCode);
      }
      return deviceCode;
    } catch (error) {
      console.error('Error registering device details:', error);
      throw error;
    }
  }
  //https://api-internal.sandbox.evident.dev/organisations/role?role=issuer&pagination=false

  async registerDevice(
    device: Device,
    files: Record<string, Express.Multer.File[]>,
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/devices', {
        name: device.projectName,
        fuel: `/fuels/${device.fuelCode}`,
      });
      await this.registerDeviceDetails(device, response.data.code, files);
      return response.data;
    } catch (error) {
      console.error('Error registering device:', error.message);
      throw error;
    }
  }

  async registerDeviceQueue(
    device: Device,
    files: {
      [DocumentType.FORM_SF_02]: Express.Multer.File[];
      [DocumentType.SF_02C]: Express.Multer.File[];
      [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
      [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
      [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
    },
  ): Promise<void> {
    await this.evidentDeviceRegistrationQueue.add({ device, files });
  }
  async getDeviceStatus(code:string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(`/devices/TESTES10735/device_details`);
      console.log(response)
      const members = response.data["hydra:member"];
      console.log("members", members);
      
      if (members && members.length > 0) {
        const status = members[0].status;
        console.log("device status:", status);
        return status;
      }
      
      throw new Error("No device details found");
      
    } catch (error) {
      console.error(
        `Failed to fetch device status for ID ${code}:`,
        error.message,
      );
    //  return `Failed to fetch status from Evident`;
      
    }
  }

}
