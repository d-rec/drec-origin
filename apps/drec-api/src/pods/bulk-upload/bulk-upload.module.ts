import { Module } from '@nestjs/common';
import {
  BulkUploadEntity,
  BulkUploadFailedLogEntity,
  BulkUploadService,
} from '.';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([BulkUploadEntity, BulkUploadFailedLogEntity]),
  ],
  controllers: [],
  providers: [BulkUploadService],
  exports: [],
})
export class BulkUploadModule {}
