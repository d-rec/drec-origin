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
import { YieldConfig } from './pods/yield-config/yieldconfig.entity';
import { YieldConfigModule } from './pods/yield-config/yieldconfig.module';
import { AccessControlLayerModuleServiceModule } from './pods/access-control-layer-module-service/access-control-layer-module-service.module';
import { AClModules } from './pods/access-control-layer-module-service/aclmodule.entity';
import { ACLModulePermissions } from './pods/permission/permission.entity';
import { PermissionModule } from './pods/permission/permission.module';
import { TestapiModule } from './pods/testapi/testapi.module';
import { Testapi } from './pods/testapi/entities/testapi.entity';
import { DeveloperScecificGroupingDeviceNotForBuyerReservationModule } from './pods/developer-specific-grouping-device-not-for-buyer-reservation/develeoper-specific-grouping-devices-not-for-buyer-reservation.module';
import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity } from './pods/developer-specific-grouping-device-not-for-buyer-reservation/developer_specific_group_device_only_for_managing_not_for_buyer_reservation.entity';
import { DeviceCsvFileProcessingJobsEntity } from './pods/device-group/device_csv_processing_jobs.entity';
import { DeviceCsvProcessingFailedRowsEntity } from './pods/device-group/device_csv_processing_failed_rows.entity';
import {DeviceGroupIssueCertificate} from './pods/device-group/device_group_issuecertificate.entity'
import {AggregateMeterRead} from './pods/reads/aggregate_readvalue.entity';
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
  YieldConfig,
  AClModules,
  ACLModulePermissions,
  Testapi,
  DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity,
  DeviceCsvFileProcessingJobsEntity,
  DeviceCsvProcessingFailedRowsEntity,
  DeviceGroupIssueCertificate,
  AggregateMeterRead,
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
    YieldConfigModule,
    AccessControlLayerModuleServiceModule,
    PermissionModule,
    TestapiModule,
    DeveloperScecificGroupingDeviceNotForBuyerReservationModule,
  ],
})
export class DrecModule {}
