import { forwardRef, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationModule } from '../organization/organization.module';
import { FileModule } from '../file/file.module';
import { BulkUploadEntity } from './bulk-uploads.entity';
import { BulkUploadService } from './bulk-upload.service';
import { BulkUploadController } from './bulk-upload.controller';
import { BulkUploadFailedLogEntity } from './bulk-uploads-failed-logs.entity';
import { ReadsModule } from '../reads/reads.module';
import { UserModule } from '../user/user.module';
import { DeviceGroupModule } from '../device-group/device-group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BulkUploadEntity, BulkUploadFailedLogEntity]),
    OrganizationModule,
    FileModule,
    forwardRef(() => ReadsModule),
    UserModule,
    forwardRef(() => DeviceGroupModule),
  ],
  controllers: [BulkUploadController],
  providers: [BulkUploadService],
  exports: [BulkUploadService, TypeOrmModule],
})
export class BulkUploadModule {}
