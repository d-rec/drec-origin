import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentUploadsEntity } from './entities/document-upload.entity';
import { FileService } from '../file/file.service';

interface UploadDocumentsPayload {
  organizationId: number;
  incorporationCertificate: Express.Multer.File;
  legalRepresentativePassport: Express.Multer.File;
  addressProof: Express.Multer.File;
  ownersDeclaration: Express.Multer.File;
}

@Injectable()
export class DocumentUploadsService {
  private readonly logger = new Logger(DocumentUploadsService.name);

  constructor(
    @InjectRepository(DocumentUploadsEntity)
    private readonly documentUploadsRepository: Repository<DocumentUploadsEntity>,
    private readonly fileService: FileService,
  ) {}

  async uploadDocuments(documentUploads: UploadDocumentsPayload): Promise<DocumentUploadsEntity> {
    this.logger.log(`Uploading documents for organization ID: ${documentUploads.organizationId}`);

    const incorporationCertPath = await this.fileService.upload(documentUploads.incorporationCertificate);
    const legalRepPassportPath = await this.fileService.upload(documentUploads.legalRepresentativePassport);
    const addressProofPath = await this.fileService.upload(documentUploads.addressProof);
    const ownersDeclPath = await this.fileService.upload(documentUploads.ownersDeclaration);

    const documentUpload = this.documentUploadsRepository.create({
      organizationId: documentUploads.organizationId,
      incorporationCertificate: incorporationCertPath,
      legalRepresentativePassport: legalRepPassportPath,
      addressProof: addressProofPath,
      ownersDeclaration: ownersDeclPath,
    });

    return this.documentUploadsRepository.save(documentUpload);
  }
}