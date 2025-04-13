import { Module } from '@nestjs/common';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentUploadsController } from './document-uploads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentUploadsEntity } from './entities/document-upload.entity';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentUploadsEntity]),
    OrganizationModule,
  ],
  controllers: [DocumentUploadsController],
  providers: [DocumentUploadsService],
  exports: [DocumentUploadsService],
})
export class DocumentUploadsModule {}
