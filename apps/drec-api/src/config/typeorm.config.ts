import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const getDBConfig = () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'origin',
});

const getMainDBConfig = () => {
  return getDBConfig();
};

const getReplicaDBConfig = () => {
  if (!process.env.DB_REPLICA_HOST) return [];
  return [
    {
      ...getDBConfig(),
      host: process.env.DB_REPLICA_HOST,
      port:
        Number(process.env.DB_REPLICA_PORT) ||
        Number(process.env.DB_PORT) ||
        5432,
    },
  ];
};

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  replication: {
    master: getMainDBConfig(),
    slaves: getReplicaDBConfig(),
  },
  logging: ['info'],
  // Default node-postgres pool size is 10. Bulk-device-registration
  // uses queryRunner.startTransaction() inside Promise.all over every
  // CSV row AND issues findOne calls on the default repository
  // (different connection). With 10 slots, the queryRunners held all
  // connections and the findOnes deadlocked. 60 fits comfortably under
  // RDS db.t3.micro's actual max_connections (81 - 3 reserved = 78),
  // with headroom for the steady-state worker pool from upstream libs.
  // Bulk-upload also batches device registrations now so a single CSV
  // doesn't try to grow the pool past this ceiling.
  extra: { max: 60 },
});
