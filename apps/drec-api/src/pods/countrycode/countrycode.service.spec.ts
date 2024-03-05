import { Test, TestingModule } from '@nestjs/testing';
import { CountrycodeService } from './countrycode.service';

describe('CountrycodeService', () => {
  let service: CountrycodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CountrycodeService,
      ],
    }).compile();

    service = module.get<CountrycodeService>(CountrycodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});