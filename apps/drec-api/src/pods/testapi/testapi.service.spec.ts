import { Test, TestingModule } from '@nestjs/testing';
import { TestapiService } from './testapi.service';

describe('TestapiService', () => {
  let service: TestapiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestapiService],
    }).compile();

    service = module.get<TestapiService>(TestapiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
