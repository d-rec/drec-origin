/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReadsService } from './reads.service';
import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { HistoryIntermediate_MeterRead } from './history_intermideate_meterread.entity';
import { DeltaFirstRead } from './delta_firstread.entity';
import { DeviceService } from '../device';
import { DeviceGroupService } from '../device-group/device-group.service';
import { OrganizationService } from '../organization/organization.service';
import { EventBus } from '@nestjs/cqrs';
import { BASE_READ_SERVICE } from './const';
import { FileService } from '../file/file.service'; // Adjust path as necessary
import { ReadsModule } from './reads.module';

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
  let historyRepository: Repository<HistoryIntermediate_MeterRead>;
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
        provide: getRepositoryToken(HistoryIntermediate_MeterRead),
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
        provide: DeviceService,
        useValue: {
          someMethod: jest.fn().mockResolvedValue('mocked-value'), // Mock method if needed
        },
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
    ],
  }).compile();

  service = module.get<ReadsService>(ReadsService);
});


  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
