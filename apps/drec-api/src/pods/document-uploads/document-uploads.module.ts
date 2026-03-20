import { forwardRef, Module } from '@nestjs/common';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentUploadsController } from './document-uploads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { DocumentEntity } from './entities/documents.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity]), FileModule, forwardRef(() => UserModule)],
  controllers: [DocumentUploadsController],
  providers: [DocumentUploadsService],
  exports: [DocumentUploadsService],
})
export class DocumentUploadsModule {}
