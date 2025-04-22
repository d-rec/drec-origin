import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DocumentEntity,
  DocumentTargetType,
  DocumentType,
} from './entities/documents.entity';
import { FileService } from '../file/file.service';
import { ILoggedInUser } from '../../models';
interface UploadDocumentPayload {
  user: ILoggedInUser;
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
    let targetId: number;
    switch (documentUploads.targetType) {
      case DocumentTargetType.USER:
        targetId = documentUploads.user.id;
        break;
      case DocumentTargetType.ORGANIZATION:
        targetId = documentUploads.user.organizationId;
        break;
      case DocumentTargetType.DEVICE:
        targetId = documentUploads.user.id;
        break;
      default:
        throw new BadRequestException('Invalid target type');
    }

    this.logger.log(`Uploading document for target ID: ${targetId}`);

    const checkIfDocumentExists = await this.documentUploadsRepository.findOne({
      where: {
        targetId: targetId,
        targetType: documentUploads.targetType,
        type: documentUploads.documentType,
      },
    });

    if (checkIfDocumentExists) {
      throw new BadRequestException({
        message: 'Document already uploaded',
        statusCode: 400,
        errorType: 'DOCUMENT_ALREADY_UPLOADED',
      });
    }

    const documentPath = await this.fileService.upload(
      documentUploads.document,
    );

    const documentUpload = this.documentUploadsRepository.create({
      targetId: targetId,
      targetType: documentUploads.targetType,
      type: documentUploads.documentType,
      extension: documentUploads.document.mimetype.split('/')[1],
      url: documentPath,
    });

    return this.documentUploadsRepository.save(documentUpload);
  }

  async getDocuments(user: ILoggedInUser): Promise<DocumentEntity[]> {
    return this.documentUploadsRepository.find({
      where: {
        targetId: user.organizationId,
        targetType: DocumentTargetType.ORGANIZATION,
      },
    });
  }
}
