import { Module } from '@nestjs/common';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentUploadsController } from './document-uploads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentUploadsEntity } from './entities/document-upload.entity';
import { OrganizationModule } from '../organization/organization.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentUploadsEntity]),
    OrganizationModule,
    FileModule,
  ],
  controllers: [DocumentUploadsController],
  providers: [DocumentUploadsService],
  exports: [DocumentUploadsService],
})
export class DocumentUploadsModule {}
