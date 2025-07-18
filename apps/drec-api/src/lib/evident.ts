import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { getRedisClient } from './redis';
import { RedisKeys } from '../utils/enums/redis-keys.enum';
import { EVIDENT_TOKEN_EXPIRATION_TIME } from '../constants';
import { encrypt, decrypt } from '../utils/crypto';

interface CreateAxiosInstanceOptions {
  baseURL: string;
  apiKey: string;
  organizationId: string;
}

export function createEvidentAxiosInstance({
  baseURL,
  apiKey,
  organizationId,
}: CreateAxiosInstanceOptions): AxiosInstance {
  const axiosInstance = axios.create({ baseURL });

  axiosRetry(axiosInstance, {
    retries: 1,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return error.response && error.response.status === 401;
    },
    onRetry: async (_retryCount, _error, requestConfig) => {
      if (apiKey) {
        const newToken = await getAuthToken(baseURL, apiKey, organizationId);
        requestConfig.headers['Authorization'] = `Bearer ${newToken}`;
      }
    },
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      let token = await getAuthTokenFromRedis(organizationId);

      if (!token && apiKey) {
        token = await getAuthToken(baseURL, apiKey, organizationId);
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

async function getAuthToken(
  apiUrl: string,
  apiKey: string,
  organizationId: string,
): Promise<string> {
  const response = await axios.post(`${apiUrl}/auth/token`, {
    token: apiKey,
  });
  await storeAuthToken(organizationId, response.data.token);
  return response.data.token;
}

async function getAuthTokenFromRedis(
  organizationId: string,
): Promise<string | null> {
  const redis = getRedisClient();
  const token = await redis.get(getRedisKey(organizationId));
  return token ? decrypt(token) : null;
}

async function storeAuthToken(
  organizationId: string,
  token: string,
): Promise<void> {
  const redis = getRedisClient();
  await redis.set(
    getRedisKey(organizationId),
    encrypt(token),
    'EX',
    EVIDENT_TOKEN_EXPIRATION_TIME,
  );
}

function getRedisKey(organizationId: string): string {
  return `${RedisKeys.EvidentToken}:${organizationId}`;
}
