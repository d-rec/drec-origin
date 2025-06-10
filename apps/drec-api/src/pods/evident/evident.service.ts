import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';
import axiosRetry from 'axios-retry';
import { Device } from '../device';
import { InjectQueue } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';
import { Queue } from 'bull';

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
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private axiosInstance: AxiosInstance;

  constructor(
    @InjectQueue(Queues.EvidentDeviceRegistration)
    private readonly evidentDeviceRegistrationQueue: Queue,
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

  async registerDeviceDetails(device: Device, code: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/device_details', {
        deviceType: `/device_types/${device.deviceTypeCode}`,
        fuel: `/fuels/${device.fuelCode}`,
        device: `/devices/${code}`,
        registrant: '/organisations/01JPQDGB2R8J17VEKQ17V7E6YK',
        issuer: '/organisations/01JPQDGJC8D5CQSBTA6FSNGA8W',
        name: device.projectName,
        capacity: device.capacity.toString(),
        supported: true,
        latitude: device.latitude,
        longitude: device.longitude,
        registrationDate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"
        commissioningDate: device.commissioningDate.split('T')[0], // should also be "YYYY-MM-DD"
        expiryDate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"
        status: EvidentRegistrationStatus.draft,
        active: true,
        address1: device.address,
        postcode: device.postcode,
        stateProvince: device.stateProvince,
        country: `/countries/GB`,
        notes: 'DREC_ID: 01JPQDGJC8D5CQSB',
        issuerNotes: 'Notes made by the Issuer Cedrick',
      });
      return response.data;
    } catch (error) {
      console.error('Error registering device details:', error);
      throw error;
    }
  }

  async registerDevice(device: Device): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/devices', {
        name: device.projectName,
        fuel: `/fuels/${device.fuelCode}`,
      });
      await this.registerDeviceDetails(device, response.data.code);
      return response.data;
    } catch (error) {
      console.error('Error registering device:', error.message);
      throw error;
    }
  }

  async registerDeviceQueue(device: Device): Promise<void> {
    await this.evidentDeviceRegistrationQueue.add({ device });
  }
}
