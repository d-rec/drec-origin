import { Module } from '@nestjs/common';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentUploadsController } from './document-uploads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationModule } from '../organization/organization.module';
import { FileModule } from '../file/file.module';
import { DocumentEntity } from './entities/documents.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity]),
    OrganizationModule,
    FileModule,
  ],
  controllers: [DocumentUploadsController],
  providers: [DocumentUploadsService],
  exports: [DocumentUploadsService],
})
export class DocumentUploadsModule {}
