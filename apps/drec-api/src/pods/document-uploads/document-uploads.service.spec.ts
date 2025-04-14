import { Test, TestingModule } from '@nestjs/testing';
import { DocumentUploadsService } from './document-uploads.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentEntity } from './entities/documents.entity';
import { FileService } from '../file/file.service';

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
          },
        },
        {
          provide: FileService,
          useValue: {
            upload: jest.fn(),
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
