import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { getRedisClient } from '../lib/redis';
import { RedisKeys } from '../utils/enums/redis-keys.enum';
import { EVIDENT_TOKEN_EXPIRATION_TIME } from '../constants';
import { BadRequestException } from '@nestjs/common';

interface CreateAxiosInstanceOptions {
  baseURL: string;
  getApiKey: () => string | null;
}

export function createEvidentAxiosInstance({
  baseURL,
  getApiKey,
}: CreateAxiosInstanceOptions): AxiosInstance {
  const redis = getRedisClient();
  const axiosInstance = axios.create({ baseURL });

  axiosRetry(axiosInstance, {
    retries: 1,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return error.response && error.response.status === 401;
    },
    onRetry: async (_retryCount, _error, requestConfig) => {
      const apiKey = getApiKey();
      if (apiKey) {
        const newToken = await getAuthToken(baseURL, apiKey);
        requestConfig.headers['Authorization'] = `Bearer ${newToken}`;
      }
    },
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      let token = await redis.get(RedisKeys.EvidentToken);
      if (!token) {
        const apiKey = getApiKey();
        if (apiKey) {
          token = await getAuthToken(baseURL, apiKey);
        }
      }
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  return axiosInstance;
}

async function getAuthToken(apiUrl: string, apiKey: string): Promise<string> {
  try {
    const response = await axios.post(`${apiUrl}/auth/token`, {
      email: 'irecregistrantuser9dec8@mail.com',
      token: apiKey,
    });
    await storeAuthToken(response.data.token);
    return response.data.token;
  } catch (error) {
    throw new BadRequestException('Invalid credentials');
  }
}

async function storeAuthToken(token: string): Promise<void> {
  const redis = getRedisClient();
  await redis.set(
    RedisKeys.EvidentToken,
    token,
    'EX',
    EVIDENT_TOKEN_EXPIRATION_TIME,
  );
}
