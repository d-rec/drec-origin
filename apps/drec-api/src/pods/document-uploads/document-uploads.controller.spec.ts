import { Test, TestingModule } from '@nestjs/testing';
import { DocumentUploadsController } from './document-uploads.controller';
import { DocumentUploadsService } from './document-uploads.service';

describe('DocumentUploadsController', () => {
  let controller: DocumentUploadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentUploadsController],
      providers: [DocumentUploadsService],
    }).compile();

    controller = module.get<DocumentUploadsController>(
      DocumentUploadsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
