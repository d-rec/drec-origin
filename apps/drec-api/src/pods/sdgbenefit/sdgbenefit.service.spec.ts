/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SdgbenefitService } from './sdgbenefit.service';
import { SDGBenefit } from './sdgbenefit.entity';

describe('SdgbenefitService', () => {
  let service: SdgbenefitService;
  let repository: Repository<SDGBenefit>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdgbenefitService,
        {
          provide: getRepositoryToken(SDGBenefit),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<SdgbenefitService>(SdgbenefitService);
    repository = module.get<Repository<SDGBenefit>>(
      getRepositoryToken(SDGBenefit),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
