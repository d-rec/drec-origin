import { ReadsService as BaseReadService } from '@energyweb/energy-api-influxdb';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DeviceModule } from '../device/device.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { BASE_READ_SERVICE } from './constants';
import { ReadsController } from './reads.controller';
import { ReadsService } from './reads.service';
import { BaseReadServiceForCi } from './baseReadServiceForCi.service';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { HistoryIntermediateMeterRead } from './history_intermideate_meterread.entity';
import { DeltaFirstRead } from './delta_firstread.entity';
import { BullModule } from '@nestjs/bull';
import { FileModule } from '../file';
import { ReadsProcessor } from './reads.processor';
import { BulkUploadModule } from '../bulk-upload/bulk-upload.module';
const baseReadServiceProvider = {
  provide: BASE_READ_SERVICE,
  useFactory: (configService: ConfigService<Record<string, any>>) => {
    if (configService.get<string>('MODE') == 'CI') {
      return new BaseReadServiceForCi();
    } else {
      return new BaseReadService(configService as any);
    }
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AggregateMeterRead,
      HistoryIntermediateMeterRead,
      DeltaFirstRead,
    ]),
    BullModule.registerQueue({
      name: 'reads-queue',
    }),
    FileModule,
    ConfigModule,
    CqrsModule,
    DeviceModule,
    DeviceGroupModule,
    UserModule,
    OrganizationModule,
    BulkUploadModule,
  ],
  controllers: [ReadsController],
  providers: [baseReadServiceProvider, ReadsService, ReadsProcessor],
  exports: [baseReadServiceProvider, ReadsService, BullModule],
})
export class ReadsModule {}
