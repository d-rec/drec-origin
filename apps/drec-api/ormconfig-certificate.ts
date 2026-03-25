import { DataSourceOptions } from 'typeorm';

// Import the configuration from @energyweb/issuer-api
const {
  migrationsTableName,
  ...dbConfig
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require('@energyweb/origin-247-certificate/dist/js/ormconfig.js');

// Create your custom DataSourceOptions object
const config: DataSourceOptions = {
  ...dbConfig,
  synchronize: false,
  migrationsRun: true,
  migrationsTableName,
  // Add any other DataSourceOptions properties if needed
};

const dataSource = config;

export default dataSource;
