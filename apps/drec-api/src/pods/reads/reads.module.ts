import { ReadsService as BaseReadService } from '@energyweb/energy-api-influxdb';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DeviceModule } from '../device/device.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { BASE_READ_SERVICE } from './const';
import { ReadsController } from './reads.controller';
import { ReadsService } from './reads.service';
import { BaseReadServiceForCi } from './baseReadServiceForCi.service';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import {AggregateMeterRead } from './aggregate_readvalue.entity'
 const baseReadServiceProvider = {
  provide: BASE_READ_SERVICE,
  useFactory: (configService: ConfigService) => {
    if (configService.get<string>('MODE') == 'CI') {
      return new BaseReadServiceForCi();
    } else {
      return new BaseReadService(configService);
    }
  },
  inject: [ConfigService],
};

@Module({

  imports: [
    TypeOrmModule.forFeature([AggregateMeterRead]),
    ConfigModule,
    CqrsModule,
    DeviceModule,
    DeviceGroupModule,
    UserModule,
    OrganizationModule,

  ],
  controllers: [ReadsController],
  providers: [baseReadServiceProvider, ReadsService],
  exports: [baseReadServiceProvider],
})
export class ReadsModule {}
