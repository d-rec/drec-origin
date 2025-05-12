import { Module } from '@nestjs/common';
import { DeviceDocumentsService } from './device-document.service';
import { DocumentEntity } from './entities/documents.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity]), FileModule],
  providers: [DeviceDocumentsService],
  exports: [DeviceDocumentsService],
})
export class DeviceDocumentsModule {}
