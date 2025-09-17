import { memoize } from 'lodash';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CommonConfiguration } from './config.interface';

export const getConfiguration = memoize(
  (): CommonConfiguration => ({
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST ?? 'localhost',
    DB_PORT: Number(process.env.DB_PORT ?? 5432),
    DB_USERNAME: process.env.DB_USERNAME ?? 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD ?? 'postgres',
    DB_DATABASE: process.env.DB_DATABASE ?? 'origin',
    REDIS_URL: process.env.REDIS_URL ?? { host: 'localhost', port: 6379 },
  }),
);

export const validateConfiguration = async () => {
  const configValues = getConfiguration();
  await validateOrReject(plainToClass(CommonConfiguration, configValues));
};
