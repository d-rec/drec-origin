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
import { ReadsBulkUploadProcessor } from './reads-bulk-upload.processor';
import { MeterRead } from './reads.entity';
import { FailedMeterRead } from './failed-reads.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeterRead, FailedMeterRead]),
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
