import { Test, TestingModule } from '@nestjs/testing';
import { DocumentUploadsController } from './document-uploads.controller';
import { DocumentUploadsService } from './document-uploads.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentEntity } from './entities/documents.entity';
import { FileService } from '../file/file.service';

describe('DocumentUploadsController', () => {
  let controller: DocumentUploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentUploadsController],
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

    controller = module.get<DocumentUploadsController>(
      DocumentUploadsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
