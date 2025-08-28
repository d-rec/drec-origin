import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { ReadsController } from './reads.controller';
import { ReadsService } from './reads.service';

import { BullModule } from '@nestjs/bull';
import { CqrsModule } from '@nestjs/cqrs';
import { defaultBullJobOptions } from '../../config/bull.config';
import { Queues } from '../../utils/enums/queues.enum';
import { BulkUploadModule } from '../bulk-upload/bulk-upload.module';
import { DeviceModule } from '../device/device.module';
import { FileModule } from '../file';
import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { DeltaFirstRead } from './delta_firstread.entity';
import { HistoryIntermediateMeterRead } from './history_intermideate_meterread.entity';
import { ReadsBulkUploadProcessor } from './reads-bulk-upload.processor';
import { MeterRead } from './reads.entity';
import { FailedMeterRead } from './failed-reads.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AggregateMeterRead,
      HistoryIntermediateMeterRead,
      MeterRead,
      DeltaFirstRead,
      FailedMeterRead,
    ]),
    BullModule.registerQueue({
      name: Queues.ReadsBulkUpload,
      defaultJobOptions: defaultBullJobOptions,
    }),
    forwardRef(() => FileModule),
    ConfigModule,
    CqrsModule,
    forwardRef(() => DeviceModule),
    forwardRef(() => DeviceGroupModule),
    UserModule,
    OrganizationModule,
    forwardRef(() => BulkUploadModule),
  ],
  controllers: [ReadsController],
  providers: [ReadsService, ReadsBulkUploadProcessor],
  exports: [ReadsService, BullModule],
})
export class ReadsModule {}
