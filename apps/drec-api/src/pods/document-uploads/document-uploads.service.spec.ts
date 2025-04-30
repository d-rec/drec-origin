import { Test, TestingModule } from '@nestjs/testing';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentEntity } from './entities/documents.entity';
import { FileService } from '../file/file.service';
import { Connection } from 'typeorm';
import { Organization } from '../organization/organization.entity';

describe('DocumentUploadsService', () => {
  let service: DocumentUploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentUploadsService,
        {
          provide: DocumentEntity,
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
          provide: Organization,
          useValue: {
            update: jest.fn(),
          },
        },
        {
          provide: Connection,
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});