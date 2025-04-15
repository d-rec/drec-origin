import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DocumentEntity,
  DocumentTargetType,
  DocumentType,
} from './entities/documents.entity';
import { FileService } from '../file/file.service';
interface UploadDocumentPayload {
  targetId: number;
  targetType: DocumentTargetType;
  documentType: DocumentType;
  document: Express.Multer.File;
}

@Injectable()
export class DocumentUploadsService {
  private readonly logger = new Logger(DocumentUploadsService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentUploadsRepository: Repository<DocumentEntity>,
    private readonly fileService: FileService,
  ) {}

  async uploadDocument(
    documentUploads: UploadDocumentPayload,
  ): Promise<DocumentEntity> {
    this.logger.log(
      `Uploading document for target ID: ${documentUploads.targetId}`,
    );

    const documentPath = await this.fileService.upload(
      documentUploads.document,
    );

    const documentUpload = this.documentUploadsRepository.create({
      targetId: documentUploads.targetId,
      targetType: documentUploads.targetType,
      type: documentUploads.documentType,
      extension: documentUploads.document.mimetype.split('/')[1],
      url: documentPath,
    });

    return this.documentUploadsRepository.save(documentUpload);
  }
}
