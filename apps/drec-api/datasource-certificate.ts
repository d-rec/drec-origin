import Dotenv from 'dotenv';
Dotenv.config({ path: '../../.env' });

import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

const config = require('@energyweb/origin-247-certificate/dist/js/ormconfig');

// TypeORM 0.3.x ships glob v10 which cannot resolve absolute Windows paths
// containing a drive letter (C:\…).  The upstream ormconfig uses a glob
// pattern for migrations, so we load the migration classes ourselves and
// pass them directly — this works on every platform.
const migrationsDir = path.resolve(
  path.dirname(
    require.resolve('@energyweb/origin-247-certificate/dist/js/ormconfig'),
  ),
  'migrations',
);
const migrationClasses = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.js') && !f.endsWith('.d.js'))
  .flatMap((f) => {
    const exports = require(path.join(migrationsDir, f));
    return Object.values(exports).filter(
      (v) => typeof v === 'function',
    );
  });

export default new DataSource({ ...config, migrations: migrationClasses });
