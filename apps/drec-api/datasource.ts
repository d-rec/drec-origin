import Dotenv from 'dotenv';
Dotenv.config({ path: '../../.env' });

import { DataSource, DataSourceOptions } from 'typeorm';

const getDBConnectionOptions = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'origin',
});

// Invoked by `migrate:docker` via ts-node + typeorm-cli `-d datasource.ts`.
// typeorm 0.3.x requires a DataSource instance, not a DataSourceOptions object —
// ormconfig.ts (which exports options) is a carryover from 0.2.x and cannot be
// used with the 0.3 CLI.
export default new DataSource({
  ...getDBConnectionOptions(),
  synchronize: false,
  migrationsRun: false,
  migrations: ['migrations/*.ts'],
  migrationsTableName: 'migrations_drec',
});
