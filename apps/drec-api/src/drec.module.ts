import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import fs from 'fs';
import path from 'path';
import { entities as IssuerEntities } from '@energyweb/issuer-api';

import { AuthModule } from './auth/auth.module';
import { User } from './pods/user/user.entity';
import { UserModule } from './pods/user/user.module';
import { Organization } from './pods/organization/organization.entity';
import { OrganizationModule } from './pods/organization/organization.module';
import { Device } from './pods/device/device.entity';
import { DeviceModule } from './pods/device/device.module';
import { File, FileModule } from './pods/file';
import { ReadsModule } from './pods/reads/reads.module';
import { DeviceGroup } from './pods/device-group/device-group.entity';
import { DeviceGroupModule } from './pods/device-group/device-group.module';
import { IssuerModule } from './pods/issuer/issuer.module';
import { MailModule } from './mail';
import { EmailConfirmationModule } from './pods/email-confirmation/email-confirmation.module';
import { EmailConfirmation } from './pods/email-confirmation/email-confirmation.entity';
import { Invitation } from './pods/invitation/invitation.entity';
import { InvitationModule } from './pods/invitation/invitation.module';
import { AdminModule } from './pods/admin/admin.module';
import { IntegratorsModule } from './pods/integrators/integrators.module';

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

export const entities = [
  User,
  Organization,
  Invitation,
  EmailConfirmation,
  Device,
  DeviceGroup,
  File,
  ...IssuerEntities,
];

const OriginAppTypeOrmModule = () => {
  return process.env.DATABASE_URL
    ? TypeOrmModule.forRoot({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        entities,
        logging: ['info'],
      })
    : TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) ?? 5432,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_DATABASE ?? 'origin',
        entities,
        logging: ['info'],
      });
};

const QueueingModule = () => {
  return BullModule.forRoot({
    redis: process.env.REDIS_URL ?? { host: 'localhost', port: 6379 },
  });
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFilePath(),
      isGlobal: true,
    }),
    OriginAppTypeOrmModule(),
    QueueingModule(),
    ScheduleModule.forRoot(),
    AuthModule,
    MailModule,
    OrganizationModule,
    UserModule,
    DeviceModule,
    DeviceGroupModule,
    FileModule,
    ReadsModule,
    IssuerModule,
    InvitationModule,
    EmailConfirmationModule,
    AdminModule,
    IntegratorsModule,
  ],
})
export class DrecModule {}
