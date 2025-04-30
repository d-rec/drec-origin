import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
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
    private readonly connection: Connection,
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

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadedFileKey: string | null = null;

    try {
      const checkIfDocumentExists =
        await this.documentUploadsRepository.findOne({
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

      const uploadResult = await this.fileService.upload(documents.documents);
      uploadedFileKey = uploadResult.key;

      this.logger.log(`Uploaded file key: ${uploadResult}`);

      const storeDocument = this.documentUploadsRepository.create({
        targetId: targetId,
        targetType: documents.targetType,
        type: documents.documentType,
        extension: documents.documents.mimetype.split('/')[1],
        url: uploadResult.Location,
      });

      if (!storeDocument) {
        throw new BadRequestException({
          message: `Failed to upload document ${documents.documentType}`,
          statusCode: 400,
        });
      }

      const saveDocument =
        await this.documentUploadsRepository.save(storeDocument);

      await this.organizationRepository.update(targetId, {
        verifiedAt: new Date(),
      });

      await queryRunner.commitTransaction();

      return saveDocument;
    } catch (error) {
      if (uploadedFileKey) {
        await this.fileService.deleteFileFromS3(uploadedFileKey);
      }

      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to upload document: ${documents.documentType} ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
