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

  async storeAuthToken(token: string): Promise<void> {
    await this.redis.set('evident_auth_token', token, 'EX', 3600);
  }

  async updateDeviceStatus(device: any,deviceStatus:string, deviceCode: string): Promise<string> {
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
      });
      return deviceCode;
    }
    catch (error) {
      console.error('Error updating device status:', error);
      throw error;
    }
  }

  async registerDeviceDetails(device: Device, deviceCode: string, files: any): Promise<any> {
    try {
      const alpha2CountryCode = getCountryCodeAlpha2(device.countryCode);
      //console.log(files, 'files');
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
      });
      if(deviceResponse){
        return this.deviceService.updateDeviceEvidentInfo(device.externalId,deviceResponse.data.code)
      }
      if (device.capacity > 250) {
        await this.updateDeviceStatus(device, EvidentRegistrationStatus.submitted, deviceCode);
      }
      return deviceCode;
    } catch (error) {
      console.error('Error registering device details:', error);
      throw error;
    }
  }
  //https://api-internal.sandbox.evident.dev/organisations/role?role=issuer&pagination=false

  async registerDevice(device: Device, files:any): Promise<any> {
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

  async registerDeviceQueue(device: Device, files: any): Promise<void> {
    await this.evidentDeviceRegistrationQueue.add({ device, files });
  }
}
