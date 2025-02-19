/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationService } from '../organization/organization.service';
import { EventBus } from '@nestjs/cqrs';
import { FileService } from '../file/file.service';
import { BulkUploadFailedLogEntity } from '../bulk-upload/bulk-uploads-failed-logs.entity';
import { BulkUploadEntity } from '../bulk-upload/bulk-uploads.entity';
import { BulkUploadService } from './bulk-upload.service';
import { ReadsService } from '../reads/reads.service';
import { DeviceGroupService } from '../device-group/device-group.service';

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

describe('BulkUploadService', () => {
  let service: BulkUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkUploadService,
        {
          provide: getRepositoryToken(BulkUploadEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BulkUploadFailedLogEntity),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: OrganizationService,
          useValue: {
            findOne: jest.fn(),
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
          provide: ReadsService,
          useValue: {
            createRead: jest.fn(),
          },
        },
        {
          provide: DeviceGroupService,
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
          },
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

    service = module.get<BulkUploadService>(BulkUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
