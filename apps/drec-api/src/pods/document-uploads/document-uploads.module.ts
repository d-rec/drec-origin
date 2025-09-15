import { Module } from '@nestjs/common';
import { DocumentUploadsService } from './document-uploads.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { DocumentEntity } from './entities/documents.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity]), FileModule],
  providers: [DocumentUploadsService],
  exports: [DocumentUploadsService],
})
export class DocumentUploadsModule {}
