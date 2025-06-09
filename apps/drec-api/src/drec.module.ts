import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import fs from 'fs';
import * as path from 'path';
import {
  BlockchainPropertiesModule,
  entities as IssuerEntities,
} from '@energyweb/issuer-api';
import {
  OnChainCertificateEntities,
  OffChainCertificateEntities,
  OnChainCertificateModule,
} from '@energyweb/origin-247-certificate';

import { AuthModule } from './auth/auth.module';
import { User } from './pods/user/user.entity';
import { UserRole } from './pods/user/user_role.entity';
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
import { ACLModulePermission } from './pods/permission/permission.entity';
import { PermissionModule } from './pods/permission/permission.module';
import { DeviceCsvFileProcessingJobsEntity } from './pods/device-group/device_csv_processing_jobs.entity';
import { DeviceCsvProcessingFailedRowsEntity } from './pods/device-group/device_csv_processing_failed_rows.entity';
import { DeviceGroupNextIssueCertificate } from './pods/device-group/device_group_issuecertificate.entity';
import { AggregateMeterRead } from './pods/reads/aggregate_readvalue.entity';
import { HistoryIntermediateMeterRead } from './pods/reads/history_intermideate_meterread.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from './pods/device/check_certificate_issue_date_log_for_device.entity';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './pods/device-group/check_certificate_issue_date_log_for_device_group.entity';
import { CountryCodeModule } from './pods/countrycode/countrycode.module';
import { SDGBenefitModule } from './pods/sdgbenefit/sdgbenefit.module';
import { SDGBenefit } from './pods/sdgbenefit/sdgbenefit.entity';
import { CertificateLogModule } from './pods/certificate-log/certificate-log.module';
import { HistoryDeviceGroupNextIssueCertificate } from './pods/device-group/history_next_issuance_date_log.entity';
import { DeltaFirstRead } from './pods/reads/delta_firstread.entity';
import { OnApplicationBootstrapHookService } from './on-application-bootsrap-hook.service';
import { IRECDevicesInformationEntity } from './pods/device/irec_devices_information.entity';
import { IRECErrorLogInformationEntity } from './pods/device/irec_error_log_information.entity';
import { OauthClientCredentials } from './pods/user/oauth_client_credentials.entity';
import { ApiUserEntity } from './pods/user/api-user.entity';
import { UserLoginSessionEntity } from './pods/user/user_login_session.entity';
import { DeviceLateOngoingIssueCertificateEntity } from './pods/device/device_lateongoing_certificate.entity';
import { CertificateSettingEntity } from './pods/device-group/certificate_setting.entity';
import { HttpModule } from '@nestjs/axios';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global.filter';
import { BulkUploadEntity } from './pods/bulk-upload/bulk-uploads.entity';
import { BulkUploadFailedLogEntity } from './pods/bulk-upload/bulk-uploads-failed-logs.entity';
import { BulkUploadModule } from './pods/bulk-upload/bulk-upload.module';
import { HealthModule } from './pods/health/health.module';
import { MeterRead } from './pods/reads/meter-reads.entity';
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
  UserRole,
  OauthClientCredentials,
  ApiUserEntity,
  Organization,
  Invitation,
  EmailConfirmation,
  Device,
  DeviceGroup,
  File,
  YieldConfig,
  AClModules,
  ACLModulePermission,
  DeviceCsvFileProcessingJobsEntity,
  DeviceCsvProcessingFailedRowsEntity,
  DeviceGroupNextIssueCertificate,
  AggregateMeterRead,
  MeterRead,
  HistoryIntermediateMeterRead,
  HistoryDeviceGroupNextIssueCertificate,
  CheckCertificateIssueDateLogForDeviceEntity,
  CheckCertificateIssueDateLogForDeviceGroupEntity,
  SDGBenefit,
  DeltaFirstRead,
  IRECDevicesInformationEntity,
  IRECErrorLogInformationEntity,
  UserLoginSessionEntity,
  DeviceLateOngoingIssueCertificateEntity,
  CertificateSettingEntity,
  ...IssuerEntities,
  ...OnChainCertificateEntities,
  ...OffChainCertificateEntities,
  BulkUploadEntity,
  BulkUploadFailedLogEntity,
];

export const originAppTypeOrmModule = (): DynamicModule => {
  const options: TypeOrmModuleOptions = process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        entities,
        logging: ['info'],
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) ?? 5432,
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_DATABASE ?? 'origin',
        entities,
        logging: ['info'],
      };

  return TypeOrmModule.forRoot(options);
};

export const redisOptions = {
  host: process.env.REDIS_URL ?? 'localhost',
  port: 6379,
};

const queueModule = () => {
  return BullModule.forRoot({
    redis: redisOptions,
    //process.env.REDIS_URL ?? { host: 'localhost', port: 6379 },
  });
};

@Module({
  imports: [
    SentryModule.forRoot(),
    HttpModule,
    ConfigModule.forRoot({
      envFilePath: getEnvFilePath(),
      isGlobal: true,
    }),
    originAppTypeOrmModule(),
    queueModule(),
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
    CountryCodeModule,
    SDGBenefitModule,
    CertificateLogModule,
    OnChainCertificateModule,
    BlockchainPropertiesModule,
    BulkUploadModule,
    HealthModule,
  ],
  providers: [
    OnApplicationBootstrapHookService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class DRECModule {}
