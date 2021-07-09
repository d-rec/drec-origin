/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { useContainer } from 'class-validator';
import { DatabaseService } from '@energyweb/origin-backend-utils';
import { BlockchainPropertiesService } from '@energyweb/issuer-api';
import { getProviderWithFallback } from '@energyweb/utils-general';
import { Contracts } from '@energyweb/issuer';

require('dotenv').config({ path: '../../../.env' });

import { entities, DrecModule } from '../src/drec.module';
import { UserService } from '../src/pods/user/user.service';
import { OrganizationService } from '../src/pods/organization';
import { ConfigService } from '@nestjs/config';

const testLogger = new Logger('e2e');

const web3 = 'http://localhost:8545';
const provider = getProviderWithFallback(web3);

export const registryDeployer = {
  address: '0x28130b5603cfcd597862a1F6786Ab430Ddc2B92F',
  privateKey:
    '0x67e9ab3282fc23c4c0d9f7b70e021d5b8177082bc3273d12b6d1ad177b307d7b',
};

const deployRegistry = async () => {
  return Contracts.migrateRegistry(provider, registryDeployer.privateKey);
};

const deployIssuer = async (registry: string) => {
  return Contracts.migrateIssuer(
    provider,
    registryDeployer.privateKey,
    registry,
  );
};

export const bootstrapTestInstance: any = async () => {
  const registry = await deployRegistry();
  const issuer = await deployIssuer(registry.address);

  const moduleFixture = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) ?? 5432,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_DATABASE ?? 'origin',
        entities,
        logging: ['info'],
        keepConnectionAlive: true,
      }),
      DrecModule,
    ],
    providers: [DatabaseService],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const databaseService = await app.resolve<DatabaseService>(DatabaseService);
  const organizationService = await app.resolve<OrganizationService>(
    OrganizationService,
  );
  const userService = await app.resolve<UserService>(UserService);
  const blockchainPropertiesService =
    await app.resolve<BlockchainPropertiesService>(BlockchainPropertiesService);
  const configService = await app.resolve<ConfigService>(ConfigService);
  await blockchainPropertiesService.create(
    provider.network.chainId,
    registry.address,
    issuer.address,
    web3,
    registryDeployer.privateKey,
  );

  app.useLogger(testLogger);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  useContainer(app.select(DrecModule), { fallbackOnErrors: true });

  return {
    databaseService,
    organizationService,
    userService,
    configService,
    app,
  };
};
