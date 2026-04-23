import Dotenv from 'dotenv';
Dotenv.config({ path: '../../.env' });

import { DataSource } from 'typeorm';
const config = require('@energyweb/origin-247-certificate/dist/js/ormconfig');

export default new DataSource(config);
