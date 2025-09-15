/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { ReadsFilterDTO, Unit } from '../../types/reads';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReadsService } from './reads.service';
import { DeviceService } from '../device/device.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import { OrganizationService } from '../organization/organization.service';
import { EventBus } from '@nestjs/cqrs';
import { FileService } from '../file/file.service';
import { BulkUploadFailedLogEntity } from '../bulk-upload/bulk-uploads-failed-logs.entity';
import { BulkUploadEntity } from '../bulk-upload/bulk-uploads.entity';
import { getQueueToken } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';
import { MeterRead } from './reads.entity';
import { FailedMeterRead } from './failed-reads.entity';
import { ReadType } from '../../utils/enums';

describe('ReadsService', () => {
  let service: ReadsService;
  let meterReadRepository: Repository<MeterRead>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadsService,
        {
          provide: getRepositoryToken(BulkUploadFailedLogEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BulkUploadEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(FailedMeterRead),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(MeterRead),
          useClass: Repository,
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
    meterReadRepository = module.get<Repository<MeterRead>>(
      getRepositoryToken(MeterRead),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find', () => {
    it('should return device reads when find is successful', async () => {
      const meterId = 'test-meter-id';
      const filter: ReadsFilterDTO = {} as unknown as ReadsFilterDTO; // Adjust as needed

      const mockReads: MeterRead[] = [
        new MeterRead({
          id: 2333,
          externalId: meterId,
          type: ReadType.Delta,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-02T00:00:00Z'),
          value: 123.45,
          unit: Unit.Wh,
        }),
        new MeterRead({
          id: 2334,
          externalId: meterId,
          type: ReadType.Delta,
          startDate: new Date('2024-01-03T00:00:00Z'),
          endDate: new Date('2024-01-04T00:00:00Z'),
          value: 678.9,
          unit: Unit.Wh,
        }),
      ];

      jest.spyOn(service, 'find').mockResolvedValue(mockReads);

      const result = await service.find(meterId, filter);

      expect(result).toEqual(mockReads);
    });

    it('should handle errors thrown by service.find', async () => {
      const meterId = 'test-meter-id';
      const filter: ReadsFilterDTO = {} as unknown as ReadsFilterDTO; // Adjust as needed

      jest
        .spyOn(meterReadRepository, 'find')
        .mockRejectedValue(new Error('Test error'));

      const result = await service.find(meterId, filter);

      expect(result).toBeUndefined(); // Expectation depends on how you handle errors in your service
    });

    it('should log errors when service.find throws an exception', async () => {
      const meterId = 'test-meter-id';
      const filter: ReadsFilterDTO = {} as unknown as ReadsFilterDTO; // Adjust as needed
      const error = new Error('Test error');

      jest.spyOn(meterReadRepository, 'find').mockRejectedValue(error);
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
