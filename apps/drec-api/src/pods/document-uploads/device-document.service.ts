import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import {
  DeviceDocument,
  DocumentTargetType,
  DocumentType,
} from './entities/device-documents.entity';
import { FileService } from '../file/file.service';

interface UploadDeviceDocumentPayload {
  organizationId: number;
  documentType: DocumentType;
  file: Express.Multer.File;
}

@Injectable()
export class DeviceDocumentsService {
  private readonly logger = new Logger(DeviceDocumentsService.name);
  constructor(
    @InjectRepository(DeviceDocument)
    private readonly documentRepository: Repository<DeviceDocument>,
    private readonly fileService: FileService,
    private readonly connection: Connection,
  ) {}

  async upload({
    organizationId,
    documentType,
    file,
  }: UploadDeviceDocumentPayload): Promise<DeviceDocument> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadedFileKey: string | null = null;

    try {
      const uploadResult = await this.fileService.upload(file);
      uploadedFileKey = uploadResult.key;

      const newDocument = this.documentRepository.create({
        targetId: organizationId,
        TargetType: DocumentTargetType.ORGANIZATION,
        type: documentType,
        extension: extension,
        url: uploadResult.Location,
      });
      const savedDocument = await this.documentRepository.save(newDocument);
      await queryRunner.commitTransaction();

      return savedDocument;
    } catch (error) {
      if (uploadedFileKey) {
        await this.fileService.deleteFileFromS3(uploadedFileKey);
      }

      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to upload document: ${documentType} - ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
