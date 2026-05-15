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
  // Default node-postgres pool size is 10. Bulk-device-registration uses
  // queryRunner.startTransaction() inside Promise.all over every CSV
  // row AND issues findOne calls on the default repository (different
  // connection). With 10 slots, the queryRunners hold all connections
  // and the findOnes deadlock. 100 gives enough headroom for ~50-row
  // CSVs to import without the self-deadlock. RDS db.t3.micro
  // max_connections is ~100, so this is safe.
  extra: { max: 100 },
});
