import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import {
  DocumentEntity,
  DocumentType,
  DocumentTargetType,
} from './entities/documents.entity';
import { DocumentExtractionEntity } from './entities/document-extraction.entity';
import { FileService } from '../file/file.service';

@Injectable()
export class DocumentUploadsService {
  private readonly logger = new Logger(DocumentUploadsService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentUploadsRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentExtractionEntity)
    private readonly extractionsRepository: Repository<DocumentExtractionEntity>,
    private readonly fileService: FileService,
    private readonly connection: DataSource,
  ) {}

  async saveExtraction(
    documentId: number,
    endpoint: string,
    response: Record<string, any>,
  ): Promise<void> {
    const doc = await this.documentUploadsRepository.findOne({
      where: { id: documentId },
    });
    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }
    await this.extractionsRepository.query(
      `INSERT INTO "document_extractions" ("document_id", "endpoint", "response", "created_at", "updated_at")
       VALUES ($1, $2, $3::jsonb, now(), now())
       ON CONFLICT ("document_id", "endpoint")
       DO UPDATE SET "response" = EXCLUDED."response", "updated_at" = now()`,
      [documentId, endpoint, JSON.stringify(response)],
    );
  }

  private async findExtractionsByDocIds(
    docIds: number[],
  ): Promise<Map<number, Record<string, any>>> {
    const out = new Map<number, Record<string, any>>();
    if (!docIds.length) return out;
    const rows: Array<{
      document_id: number;
      endpoint: string;
      response: Record<string, any>;
    }> = await this.extractionsRepository.query(
      `SELECT "document_id", "endpoint", "response"
       FROM "document_extractions"
       WHERE "document_id" = ANY($1::int[])`,
      [docIds],
    );
    for (const r of rows) {
      const bucket = out.get(r.document_id) ?? {};
      bucket[r.endpoint] = r.response;
      out.set(r.document_id, bucket);
    }
    return out;
  }

  async getSignedUrl(id: number): Promise<string> {
    const doc = await this.documentUploadsRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return this.fileService.getSignedUrl(doc.url);
  }

  async getDocumentMeta(
    id: number,
  ): Promise<{ key: string; filename: string }> {
    const doc = await this.documentUploadsRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return {
      key: doc.url,
      filename: doc.originalFilename || doc.url.split('/').pop() || `doc-${id}`,
    };
  }

  async findByTarget(
    targetId: number,
    targetType: DocumentTargetType,
  ): Promise<
    {
      type: string;
      url: string;
      id: number;
      label: string | null;
      originalFilename: string | null;
      createdAt: Date;
      extractions: Record<string, any>;
    }[]
  > {
    const docs = await this.documentUploadsRepository.find({
      where: { targetId, targetType },
    });
    const extractionsByDocId = await this.findExtractionsByDocIds(
      docs.map((d) => d.id),
    );
    const results: {
      type: string;
      url: string;
      id: number;
      label: string | null;
      originalFilename: string | null;
      createdAt: Date;
      extractions: Record<string, any>;
    }[] = [];
    for (const doc of docs) {
      let signedUrl = '';
      try {
        signedUrl = await this.fileService.getSignedUrl(doc.url);
      } catch {
        signedUrl = '';
      }
      results.push({
        type: doc.type,
        url: signedUrl,
        id: doc.id,
        label: doc.label,
        originalFilename: doc.originalFilename,
        createdAt: doc.createdAt,
        extractions: extractionsByDocId.get(doc.id) ?? {},
      });
    }
    return results;
  }

  async updateLabel(id: number, label: string | null): Promise<DocumentEntity> {
    const doc = await this.documentUploadsRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    doc.label = label && label.trim() !== '' ? label.trim() : null;
    return this.documentUploadsRepository.save(doc);
  }

  async deleteById(id: number, targetId: number): Promise<void> {
    const doc = await this.documentUploadsRepository.findOne({
      where: { id, targetId },
    });
    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    if (doc.url) {
      await this.fileService
        .deleteFileFromS3(decodeURIComponent(doc.url))
        .catch(() => {});
    }
    await this.documentUploadsRepository.remove([doc]);
  }

  /** Delete every document attached to any of the given device IDs and
   *  remove the underlying S3 objects. Best-effort on S3 — DB rows are
   *  always cleared. */
  async deleteAllByDevices(deviceIds: number[]): Promise<number> {
    if (!deviceIds.length) return 0;
    const docs = await this.documentUploadsRepository.find({
      where: { targetId: In(deviceIds), targetType: DocumentTargetType.DEVICE },
    });
    for (const doc of docs) {
      if (doc.url) {
        await this.fileService
          .deleteFileFromS3(decodeURIComponent(doc.url))
          .catch(() => {});
      }
    }
    if (docs.length) {
      await this.documentUploadsRepository.remove(docs);
    }
    return docs.length;
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
    label?: string | null,
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
        originalFilename: file.originalname,
        label: label && label.trim() !== '' ? label.trim() : null,
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
