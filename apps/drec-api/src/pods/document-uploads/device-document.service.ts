import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import {
  DeviceDocument,
  DocumentTargetType,
  DocumentType,
} from './entities/device-documents.entity';
import { FileService } from '../file/file.service';

interface UploadDeviceDocumentPayload {
  deviceId: number;
  documentType: DocumentType;
  file: Express.Multer.File;
}

@Injectable()
export class DeviceDocumentsService {
    private readonly logger = new Logger(DeviceDocumentsService.name);

    private readonly allowedExtensions = [
      'avif', 'bmp', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'tif', 'tiff',
      'webp', 'pdf', 'doc', 'xls', 'docx', 'xlsx', 'pptx', 'gsheet', 'gdoc', 'txt', 'csv',
    ];
  
    private readonly MAX_FILE_SIZE_MB = 20;
  constructor(
    @InjectRepository(DeviceDocument)
    private readonly documentRepository: Repository<DeviceDocument>,
    private readonly fileService: FileService,
    private readonly connection: Connection,
  ) {}

  async upload({
    deviceId,
    documentType,
    file,
  }: UploadDeviceDocumentPayload): Promise<DeviceDocument> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const sizeInMB = file.size / (1024 * 1024);

    if (!extension || !this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`File type .${extension} is not supported`);
    }

    if (sizeInMB > this.MAX_FILE_SIZE_MB) {
      throw new BadRequestException(`File size exceeds 20MB limit`);
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadedFileKey: string | null = null;

    try {

      const uploadResult = await this.fileService.upload(file);
      uploadedFileKey = uploadResult.key;

      const newDocument = this.documentRepository.create({
        targetId: deviceId,
        TargetType: DocumentTargetType.DEVICE,
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
