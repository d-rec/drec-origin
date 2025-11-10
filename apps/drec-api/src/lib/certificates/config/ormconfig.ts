import { ConnectionOptions } from 'typeorm';
import { getConfiguration } from './configuration';

const getDBConnectionOptions = (): ConnectionOptions => {
  const configuration = getConfiguration();

  return configuration.DATABASE_URL
    ? {
        type: 'postgres',
        url: configuration.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        type: 'postgres',
        host: configuration.DB_HOST,
        port: configuration.DB_PORT,
        username: configuration.DB_USERNAME,
        password: configuration.DB_PASSWORD,
        database: configuration.DB_DATABASE,
      };
};

const config: ConnectionOptions = {
  ...getDBConnectionOptions(),
  synchronize: false,
  migrationsRun: true,
  migrations: [`${__dirname}/migrations/*.js`],
  migrationsTableName: 'migrations_247_certificate',
};

export = config;
