/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SdgbenefitService } from './sdgbenefit.service';
import { SdgBenefit } from './sdgbenefit.entity';

describe('SdgbenefitService', () => {
  let service: SdgbenefitService;
  let repository: Repository<SdgBenefit>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdgbenefitService,
        {
          provide: getRepositoryToken(SdgBenefit),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<SdgbenefitService>(SdgbenefitService);
    repository = module.get<Repository<SdgBenefit>>(
      getRepositoryToken(SdgBenefit),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
