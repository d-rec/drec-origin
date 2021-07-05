import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import fs from 'fs';
import path from 'path';

const getEnvFilePath = () => {
  const pathsToTest = [
    '../../../.env',
    '../../../../.env',
    '../../../../../.env',
    '../../../../../../../.env',
  ];

  for (const pathToTest of pathsToTest) {
    const resolvedPath = path.resolve(__dirname, pathToTest);

    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }
};

const OriginAppTypeOrmModule = () => {
  return process.env.DATABASE_URL
    ? TypeOrmModule.forRoot({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        logging: ['info'],
      })
    : TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) ?? 5432,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_DATABASE ?? 'origin',
        logging: ['info'],
      });
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFilePath(),
      isGlobal: true,
    }),
    OriginAppTypeOrmModule(),
    ScheduleModule.forRoot(),
  ],
})
export class DrecModule {}
