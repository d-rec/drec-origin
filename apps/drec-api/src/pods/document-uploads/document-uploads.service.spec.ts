import { Test, TestingModule } from '@nestjs/testing';
import { DocumentUploadsService } from './document-uploads.service';

describe('DocumentUploadsService', () => {
  let service: DocumentUploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentUploadsService],
    }).compile();

    service = module.get<DocumentUploadsService>(DocumentUploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
