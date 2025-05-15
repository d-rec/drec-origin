import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import {
  DocumentEntity,
  DocumentType,
  DocumentTargetType,
} from './entities/documents.entity';
import { FileService } from '../file/file.service';

@Injectable()
export class DocumentUploadsService {
  private readonly logger = new Logger(DocumentUploadsService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentUploadsRepository: Repository<DocumentEntity>,
    private readonly fileService: FileService,
    private readonly connection: Connection,
  ) {}

  async upload(
    targetId: number,
    targetType: DocumentTargetType,
    documentType: DocumentType,
    file: Express.Multer.File,
  ): Promise<any> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    this.logger.log(`Uploading document for target ID: ${targetId}`);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadedFileKey: string | null = null;

    try {
      const uploadResult = await this.fileService.upload(file);
      uploadedFileKey = uploadResult.key;

      this.logger.log(`Uploaded file key: ${uploadResult}`);

      const store = this.documentUploadsRepository.create({
        targetId: targetId,
        targetType: targetType,
        type: documentType,
        extension: extension,
        url: uploadResult.Location,
      });

      const save = await this.documentUploadsRepository.save(store);

      await queryRunner.commitTransaction();

      return save;
    } catch (error) {
      if (uploadedFileKey) {
        await this.fileService.deleteFileFromS3(uploadedFileKey);
      }

      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to upload document: ${documentType} ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
