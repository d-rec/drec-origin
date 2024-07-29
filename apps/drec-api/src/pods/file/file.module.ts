import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { DeviceGroupModule } from '../device-group/device-group.module';
//import { DeviceCsvFileProcessingJobsEntity } from '../device-group/device_csv_processing_jobs.entity';

import { FileController } from './file.controller';
import { File } from './file.entity';
import { FileService } from './file.service';
import { UserModule } from '../user/user.module';

@Module({
  // imports: [TypeOrmModule.forFeature([File,DeviceCsvFileProcessingJobsEntity]),
  imports: [TypeOrmModule.forFeature([File]), UserModule],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
