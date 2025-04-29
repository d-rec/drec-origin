import { Test, TestingModule } from '@nestjs/testing';
import { DocumentUploadsService } from './document-uploads.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentEntity } from './entities/documents.entity';
import { FileService } from '../file/file.service';
import { Organization } from '../organization/organization.entity';

describe('DocumentUploadsService', () => {
  let service: DocumentUploadsService;

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
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentUploadsService>(DocumentUploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
