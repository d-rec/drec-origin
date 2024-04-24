require('dotenv').config({ path: '../../.env' });

import { DataSource, DataSourceOptions } from 'typeorm';

const getDBConnectionOptions = (): DataSourceOptions => {
  return process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) ?? 5432,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_DATABASE ?? 'origin',
      };
};

const dataSource = new DataSource({
  ...getDBConnectionOptions(),
  synchronize: false,
  migrationsRun: true,
  migrations: [`${__dirname}/migrations/*.js`],
  migrationsTableName: 'migrations_drec',
});

export default dataSource;