/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReadsService } from './reads.service';
import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { HistoryIntermediateMeterRead } from './history_intermideate_meterread.entity';
import { DeltaFirstRead } from './delta_firstread.entity';
import { DeviceService } from '../device';
import { DeviceGroupService } from '../device-group/device-group.service';
import { OrganizationService } from '../organization/organization.service';
import { EventBus } from '@nestjs/cqrs';
import { FileService } from '../file/file.service';
import { BASE_READ_SERVICE } from './constants';

jest.mock('@influxdata/influxdb-client', () => {
  return {
    InfluxDB: jest.fn().mockImplementation(() => {
      return {
        getQueryApi: jest.fn().mockReturnValue({
          queryRows: jest.fn(),
        }),
      };
    }),
  };
});

describe('ReadsService', () => {
  let service: ReadsService;
  let aggregateRepository: Repository<AggregateMeterRead>;
  let historyRepository: Repository<HistoryIntermediateMeterRead>;
  let deltaRepository: Repository<DeltaFirstRead>;
  let deviceService: DeviceService;
  let deviceGroupService: DeviceGroupService;
  let organizationService: OrganizationService;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadsService,
        {
          provide: getRepositoryToken(AggregateMeterRead),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(HistoryIntermediateMeterRead),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DeltaFirstRead),
          useClass: Repository,
        },
        {
          provide: BASE_READ_SERVICE,
          useValue: {} as any,
        },
        {
          provide: 'BullQueue_reads-queue',
          useValue: {
            add: jest.fn(),
            process: jest.fn(),
          },
        },
        {
          provide: FileService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('mock-file-url'),
            retrieveFile: jest.fn().mockResolvedValue('mock-file-content'),
          },
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
          useValue: {
            publish: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReadsService>(ReadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
