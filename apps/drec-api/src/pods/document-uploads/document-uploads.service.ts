import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DocumentEntity,
  DocumentTargetType,
  DocumentType,
} from './entities/documents.entity';
import { FileService } from '../file/file.service';
import { Organization } from '../organization/organization.entity';
import { ILoggedInUser } from '../../models/LoggedInUser';
interface UploadDocumentPayload {
  user: ILoggedInUser;
  targetType: DocumentTargetType;
  documentType: DocumentType;
  documents: Express.Multer.File;
}

@Injectable()
export class DocumentUploadsService {
  private readonly logger = new Logger(DocumentUploadsService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentUploadsRepository: Repository<DocumentEntity>,
    private readonly fileService: FileService,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async upload(documents: UploadDocumentPayload): Promise<DocumentEntity> {
    let targetId: number;
    switch (documents.targetType) {
      case DocumentTargetType.USER:
        targetId = documents.user.id;
        break;
      case DocumentTargetType.ORGANIZATION:
        targetId = documents.user.organizationId;
        break;
      case DocumentTargetType.DEVICE:
        targetId = documents.user.id;
        break;
      default:
        throw new BadRequestException('Invalid target type');
    }

    this.logger.log(`Uploading document for target ID: ${targetId}`);

    const checkIfDocumentExists = await this.documentUploadsRepository.findOne({
      where: {
        targetId: targetId,
        targetType: documents.targetType,
        type: documents.documentType,
      },
    });

    if (checkIfDocumentExists) {
      throw new BadRequestException({
        message: `Document ${documents.documentType} already uploaded`,
        statusCode: 400,
      });
    }

    const documentPath = await this.fileService.upload(documents.documents);

    const documentUpload = this.documentUploadsRepository.create({
      targetId: targetId,
      targetType: documents.targetType,
      type: documents.documentType,
      extension: documents.documents.mimetype.split('/')[1],
      url: documentPath,
    });

    if (!documentUpload) {
      throw new BadRequestException({
        message: `Failed to upload document ${documents.documentType}`,
        statusCode: 400,
      });
    }

    this.organizationRepository.update(targetId, {
      verifiedAt: new Date(),
    });

    return this.documentUploadsRepository.save(documentUpload);
  }
}
