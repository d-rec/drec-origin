import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadLogEntity } from './upload-log.entity';
import { UploadLogService } from './upload-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UploadLogEntity])],
  providers: [UploadLogService],
  exports: [UploadLogService],
})
export class UploadLogModule {}
