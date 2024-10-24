import { ConnectionOptions } from 'typeorm';
import { getDBConnectionOptions } from '@energyweb/origin-backend-utils';

// Import the configuration from @energyweb/issuer-api
const {
  synchronize,
  migrationsRun,
  migrationsTableName,
  ...dbConfig
} = require('@energyweb/issuer-api/dist/js/ormconfig.js');

// Create your custom DataSourceOptions object
const config: ConnectionOptions = {
  ...dbConfig,
  synchronize: false,
  migrationsRun: true,
  migrationsTableName,
  // Add any other DataSourceOptions properties if needed
};

const dataSource = config;

export default dataSource;
