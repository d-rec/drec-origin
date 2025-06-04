import { TypeOrmModuleOptions } from "@nestjs/typeorm";

const getDBConfig = () => ({
  port: Number(process.env.DB_PORT) ?? 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'origin',
});

const getMainDBConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  return getDBConfig();
};

const getReplicaDBConfig = () => {
  if (!process.env.DB_REPLICA_HOST) return [];
  return [
    {
      ...getDBConfig(),
      host: process.env.DB_REPLICA_HOST,
      port:
        Number(process.env.DB_REPLICA_PORT) ??
        Number(process.env.DB_PORT) ??
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
});
