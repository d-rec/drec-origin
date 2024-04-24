import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { YieldConfigService } from './yieldconfig.service';
import { YieldConfig } from './yieldconfig.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('YieldConfigService', () => {
  let service: YieldConfigService;
  let repository: Repository<YieldConfig>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YieldConfigService,
        {
          provide: getRepositoryToken(YieldConfig),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<YieldConfigService>(YieldConfigService);
    repository = module.get<Repository<YieldConfig>>(
      getRepositoryToken(YieldConfig),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
