import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private readonly connection: DataSource,
  ) {}

  async getSignedUrl(id: number): Promise<string> {
    const doc = await this.documentUploadsRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return this.fileService.getSignedUrl(doc.url);
  }

  async findByTarget(
    targetId: number,
    targetType: DocumentTargetType,
  ): Promise<{ type: string; url: string; id: number }[]> {
    const docs = await this.documentUploadsRepository.find({
      where: { targetId, targetType },
    });
    const results: { type: string; url: string; id: number }[] = [];
    for (const doc of docs) {
      try {
        const signedUrl = await this.fileService.getSignedUrl(doc.url);
        results.push({ type: doc.type, url: signedUrl, id: doc.id });
      } catch {
        results.push({ type: doc.type, url: '', id: doc.id });
      }
    }
    return results;
  }

  async deleteByType(
    targetId: number,
    targetType: DocumentTargetType,
    documentType: DocumentType,
  ): Promise<void> {
    const docs = await this.documentUploadsRepository.find({
      where: { targetId, targetType, type: documentType },
    });
    for (const doc of docs) {
      await this.fileService.deleteFileFromS3(doc.url).catch(() => {});
    }
    await this.documentUploadsRepository.remove(docs);
  }

  async upload(
    targetId: number,
    targetType: DocumentTargetType,
    documentType: DocumentType,
    file: Express.Multer.File,
    subfolder?: string,
  ): Promise<any> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    this.logger.log(`Uploading document for target ID: ${targetId}`);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let uploadedFileKey: string | null = null;

    try {
      // Clear reviewed_flag on existing documents of the same type for this target,
      // so reviewers must re-review after a new upload
      await this.documentUploadsRepository.update(
        { targetId, targetType, type: documentType },
        { reviewedFlag: false },
      );

      const uploadResult = await this.fileService.upload(file, subfolder);
      uploadedFileKey = uploadResult.Key;

      const newDocumentUpload = this.documentUploadsRepository.create({
        targetId: targetId,
        targetType: targetType,
        type: documentType,
        extension: extension,
        url: uploadResult.Key,
      });

      const savedDocumentUpload =
        await this.documentUploadsRepository.save(newDocumentUpload);

      await queryRunner.commitTransaction();

      return savedDocumentUpload;
    } catch (error) {
      if (uploadedFileKey) {
        await this.fileService
          .deleteFileFromS3(uploadedFileKey)
          .catch(() => {});
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
