import { DataSourceOptions } from 'typeorm';

const getDBConnectionOptions = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'origin',
});

const config: DataSourceOptions = {
  ...getDBConnectionOptions(),
  synchronize: false,
  migrationsRun: true,
  migrations: [`${__dirname}/migrations/*.js`],
  migrationsTableName: 'migrations_drec',
  // TypeORM defaults to a pool of 10. Background workers from upstream
  // libraries (off-chain certificate writes etc.) wedge connections in
  // 'idle in transaction' state, starving every other API request of a
  // free connection — login + /device/my time out at 504. 30 gives
  // headroom for the worker pool plus normal API traffic.
  extra: { max: 30 },
};

export = config;
