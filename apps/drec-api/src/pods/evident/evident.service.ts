import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';
import axiosRetry from 'axios-retry';
import { Device } from '../device';
import { InjectQueue } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';
import { Queue } from 'bull';
// import { getCountryCodeAlpha2 } from '../../utils/get-country-code-alpha-2';

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
      retryCondition: (error) => error.response?.status === 401,
      onRetry: async (retryCount, error, requestConfig) => {
        if (error.response?.status === 401) {
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

  async storeAuthToken(token: string): Promise<void> {
    await this.redis.set('evident_auth_token', token, 'EX', 3600);
  }

  async fetchDevices(): Promise<any> {
    const response = await this.axiosInstance.get('/devices');
    return response.data;
  }

  async getDeviceStatus(deviceId: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(`/devices/${deviceId}`);
      const externalStatus = response.data?.status;

      return this.mapStatus(externalStatus);
    } catch (error) {
      console.error(`Failed to fetch device status for ID ${deviceId}:`, error.message);
      throw new Error(`Failed to fetch status from Evident`);
    }
  }

  private mapStatus(externalStatus: string): string {
    const statusMap = {
      approved: 'APPROVED',
      submitted: 'SUBMITTED',
      draft: 'DRAFT',
    };

    return statusMap[externalStatus?.toLowerCase()] ?? 'UNKNOWN';
  }

}
