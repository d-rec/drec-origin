import { Module } from '@nestjs/common';
import { DeviceDocumentsService } from './device-document.service';
import { DeviceDocument } from './entities/device-documents.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file';


@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceDocument]),
    FileModule,
  ],
  providers: [DeviceDocumentsService],
  exports: [DeviceDocumentsService], 
})
export class DeviceDocumentsModule {}