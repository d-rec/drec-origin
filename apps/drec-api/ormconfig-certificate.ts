import { ConnectionOptions } from 'typeorm';

// Import the configuration from @energyweb/issuer-api
const {
  migrationsTableName,
  ...dbConfig
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require('./src/pods/utils/origin-247-certificate/config/ormconfig.ts');

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
