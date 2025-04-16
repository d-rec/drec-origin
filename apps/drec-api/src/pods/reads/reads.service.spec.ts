/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ReadsService as BaseReadsService,
  FilterDTO,
} from '@energyweb/energy-api-influxdb';
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
import { BulkUploadFailedLogEntity } from '../bulk-upload/bulk-uploads-failed-logs.entity';
import { BulkUploadEntity } from '../bulk-upload/bulk-uploads.entity';
import { getQueueToken } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';

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
  let baseReadsService: BaseReadsService;
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
          provide: getRepositoryToken(BulkUploadFailedLogEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BulkUploadEntity),
          useValue: {},
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
          useValue: {
            find: jest.fn(),
          } as any,
        },
        {
          provide: getQueueToken(Queues.ReadsBulkUpload),
          useValue: {},
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
    baseReadsService = module.get<BaseReadsService>(BASE_READ_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find', () => {
    it('should return device reads when find is successful', async () => {
      const meterId = 'test-meter-id';
      const filter: FilterDTO = {} as unknown as FilterDTO; // Adjust as needed
      const mockReads = [
        { timestamp: new Date('2024-01-01T00:00:00Z'), value: 123.45 },
        { timestamp: new Date('2024-01-02T00:00:00Z'), value: 678.9 },
      ];

      jest.spyOn(baseReadsService, 'find').mockResolvedValue(mockReads);

      const result = await service.find(meterId, filter);

      expect(result).toEqual(mockReads);
    });

    it('should handle errors thrown by baseReadsService.find', async () => {
      const meterId = 'test-meter-id';
      const filter: FilterDTO = {} as unknown as FilterDTO; // Adjust as needed

      jest
        .spyOn(baseReadsService, 'find')
        .mockRejectedValue(new Error('Test error'));

      const result = await service.find(meterId, filter);

      expect(result).toBeUndefined(); // Expectation depends on how you handle errors in your service
    });

    it('should log errors when baseReadsService.find throws an exception', async () => {
      const meterId = 'test-meter-id';
      const filter: FilterDTO = {} as unknown as FilterDTO; // Adjust as needed
      const error = new Error('Test error');

      jest.spyOn(baseReadsService, 'find').mockRejectedValue(error);
      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      await service.find(meterId, filter);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'exception caught in between device onboarding checking for createdAt',
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
