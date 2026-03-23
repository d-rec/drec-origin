import { Test, TestingModule } from '@nestjs/testing';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentEntity } from './entities/documents.entity';
import { FileService } from '../file/file.service';
import { DataSource, Repository } from 'typeorm';
import { Organization } from '../organization/organization.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('DocumentUploadsService', () => {
  let service: DocumentUploadsService;
  let documentRepository: Repository<DocumentEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentUploadsService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: FileService,
          useValue: {
            upload: jest.fn(),
            deleteFileFromS3: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            update: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                // Add any manager methods used in your service
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentUploadsService>(DocumentUploadsService);
    documentRepository = module.get<Repository<DocumentEntity>>(
      getRepositoryToken(DocumentEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a valid document repository', () => {
    expect(documentRepository).toBeDefined();
  });
});
