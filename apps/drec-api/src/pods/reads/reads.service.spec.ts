import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReadsService } from './reads.service';
import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { HistoryIntermediate_MeterRead } from './history_intermideate_meterread.entity';
import { DeltaFirstRead } from './delta_firstread.entity';
import { ReadsService as BaseReadService } from '@energyweb/energy-api-influxdb';
import { DeviceService } from '../device';
import { DeviceGroupService } from '../device-group/device-group.service';
import { OrganizationService } from '../organization/organization.service';
import { EventBus } from '@nestjs/cqrs';

describe('ReadsService', () => {
  let service: ReadsService;
  let aggregateRepository: Repository<AggregateMeterRead>;
  let historyRepository: Repository<HistoryIntermediate_MeterRead>;
  let deltaRepository: Repository<DeltaFirstRead>;
  let baseReadsService: BaseReadService;
  let deviceService: DeviceService;
  let deviceGroupService: DeviceGroupService;
  let organizationService: OrganizationService;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadsService,
        {
          provide: getRepositoryToken(AggregateMeterRead),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(HistoryIntermediate_MeterRead),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DeltaFirstRead),
          useClass: Repository,
        },
        {
          provide: BaseReadService,
          useValue: {} as any,
        },
        {
          provide: DeviceService,
          useValue: {} as any,
        },
        {
          provide: DeviceGroupService,
          useValue: {} as any,
        },
        {
          provide: OrganizationService,
          useValue: {} as any,
        },
        {
          provide: EventBus,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<ReadsService>(ReadsService);
    aggregateRepository = module.get<Repository<AggregateMeterRead>>(getRepositoryToken(AggregateMeterRead));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});