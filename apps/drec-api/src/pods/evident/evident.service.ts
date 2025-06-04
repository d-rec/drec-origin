import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { getRedisClient } from '../../lib/redis';
import { RedisKeys } from 'src/utils/enums/redis-keys.enum';
import { EVIDENT_TOKEN_EXPIRATION_TIME } from '../../constants';

@Injectable()
export class EvidentService {
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;
  private email = process.env.IREC_EVIDENT_REGISTRANT_EMAIL || null;
  private apiToken = process.env.IREC_EVIDENT_API_Token || null;
  private redis: ReturnType<typeof getRedisClient>;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.redis = getRedisClient();

    this.axiosInstance = axios.create({ baseURL: this.apiUrl });

    axiosRetry(this.axiosInstance, {
      retries: 1,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return error.response && error.response.status === 401;
      },
      onRetry: async (_retryCount, _error, requestConfig) => {
        const newToken = await this.getAuthToken();
        requestConfig.headers['Authorization'] = `Bearer ${newToken}`;
      },
    });

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        let token = await this.redis.get(RedisKeys.EvidentToken);
        if (!token) {
          token = await this.getAuthToken();
        }
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
    await this.storeAuthToken(response.data.token);
    return response.data.token;
  }

  private async storeAuthToken(token: string): Promise<void> {
    await this.redis.set(
      RedisKeys.EvidentToken,
      token,
      'EX',
      EVIDENT_TOKEN_EXPIRATION_TIME,
    );
  }

  async fetchDevices(): Promise<any> {
    const response = await this.axiosInstance.get('/devices');
    return response.data;
  }
}
