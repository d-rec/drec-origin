import Dotenv from 'dotenv';
Dotenv.config({ path: '../../.env' });

import { DataSource } from 'typeorm';
const config = require('@energyweb/issuer-api/dist/js/ormconfig');

export default new DataSource(config);
