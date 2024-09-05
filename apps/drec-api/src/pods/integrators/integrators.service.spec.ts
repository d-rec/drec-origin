/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from '../device';
import { HttpService } from '@nestjs/axios';
import { BASE_READ_SERVICE } from '../reads/const';
import { IntegratorsService } from './integrators.service';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { of, throwError } from 'rxjs';
import { BigNumber } from 'ethers';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import { DateTime } from 'luxon';
import {
  MeasurementDTO,
  ReadDTO,
  Unit,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';

describe('IntegratorsService', () => {
  let service: IntegratorsService;
  let httpService: HttpService;
  let deviceService: DeviceService;
  let configService: ConfigService;
  let eventBus: EventBus;
  let baseReadsService: BaseReadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegratorsService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          } as any,
        },
        {
          provide: DeviceService,
          useValue: {} as any,
        },
        {
          provide: BASE_READ_SERVICE,
          useValue: {
            store: jest.fn(),
          } as any,
        },
        ConfigService,

        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    service = module.get<IntegratorsService>(IntegratorsService);
    httpService = module.get<HttpService>(HttpService);
    deviceService = module.get<DeviceService>(DeviceService);
    configService = module.get<ConfigService>(ConfigService);
    eventBus = module.get<EventBus>(EventBus);
    baseReadsService = module.get<BaseReadsService>(BASE_READ_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginBBOX', () => {
    it('should log in successfully and return the API token', async () => {
      const server = 'http://example.com';
      const loginForm = { getHeaders: () => ({}) } as any; // Mocked FormData
      const apiToken = 'test_token';
      const mockResponse = {
        data: {
          message: {
            login_successful: {
              API_token: apiToken,
            },
          },
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));
      const result = await service.loginBBOX(server, loginForm);
      
      expect(httpService.post).toHaveBeenCalledWith(
        `${server}/v1/auth/login`,
        loginForm,
        { headers: loginForm.getHeaders() },
      );
      expect(result).toEqual(apiToken);
    });
  });

  describe('getBBOXproductReadData', () => {
    it('should return energy_out data successfully', async () => {
      const server = 'http://example.com';
      const token = 'test_token';
      const productId = '1234';
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const mockData = { data: { data: { energy_out: 5000 } } };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockData));

      const result = await service.getBBOXproductReadData(server, token, productId, startDate, endDate);

      expect(httpService.get).toHaveBeenCalledWith(
        `${server}/v1/products/${productId}/data`,
        {
          headers: { Authorization: `Token token=${token}` },
          params: {
            start: startDate,
            end: endDate,
            measurement: 'analysis',
            fields: 'energy_out',
          },
        }
      );
      expect(result).toEqual(5000);
    });

    it('should handle errors properly', async () => {
      const server = 'http://example.com';
      const token = 'test_token';
      const productId = '1234';
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const errorMessage = 'Network Error';

      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error(errorMessage)));

      await expect(service.getBBOXproductReadData(server, token, productId, startDate, endDate))
        .rejects.toThrow(errorMessage);

      expect(httpService.get).toHaveBeenCalledWith(
        `${server}/v1/products/${productId}/data`,
        {
          headers: { Authorization: `Token token=${token}` },
          params: {
            start: startDate,
            end: endDate,
            measurement: 'analysis',
            fields: 'energy_out',
          },
        }
      );
    });
  });

  describe('storeBBOXenergyReads', () => {
    it('should log and return when no energy data is found', async () => {
      const server = 'http://example.com';
      const authToken = 'test_token';
      const externalId = '1234';
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const organizationId = 1;

      const getBBOXproductReadDataSpy = jest.spyOn(service, 'getBBOXproductReadData').mockResolvedValue([]);
      const storeEnergySpy = jest.spyOn(service, 'storeEnergy');

      await service.storeBBOXenergyReads(server, authToken, externalId, startDate, endDate, organizationId);

      expect(getBBOXproductReadDataSpy).toHaveBeenCalledWith(server, authToken, externalId, startDate, endDate);
      expect(storeEnergySpy).not.toHaveBeenCalled();
    });

    it('should store energy data when data is present', async () => {
      const server = 'http://example.com';
      const authToken = 'test_token';
      const externalId = '1234';
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const organizationId = 1;
      const mockEnergyData = [['100', '2023-01-01T00:00:00Z']];

      const getBBOXproductReadDataSpy = jest.spyOn(service, 'getBBOXproductReadData').mockResolvedValue(mockEnergyData);
      const storeEnergySpy = jest.spyOn(service, 'storeEnergy').mockResolvedValue();

      await service.storeBBOXenergyReads(server, authToken, externalId, startDate, endDate, organizationId);

      expect(getBBOXproductReadDataSpy).toHaveBeenCalledWith(server, authToken, externalId, startDate, endDate);
      expect(storeEnergySpy).toHaveBeenCalledWith(
        externalId,
        [
          {
            timestamp: new Date(mockEnergyData[0][1]),
            value: parseFloat(mockEnergyData[0][0]),
          },
        ],
        Unit.kWh,
        organizationId
      );
    });
  });
  
  describe('storeEnergy', () => {
    it('should log measurements and call baseReadsService.store', async () => {
      const externalId = 'device123';
      const reads: ReadDTO[] = [
        { timestamp: new Date('2023-01-01T00:00:00Z'), value: 100 },
      ];
      const unit = Unit.kWh;
      const organizationId = 1;

      await service.storeEnergy(externalId, reads, unit, organizationId);

      const measurements = new MeasurementDTO();
      measurements.reads = reads;
      measurements.unit = unit;

      expect(baseReadsService.store).toHaveBeenCalledWith(externalId, measurements);
    });

    it('should publish GenerationReadingStoredEvent for each read', async () => {
      const externalId = 'device123';
      const reads: ReadDTO[] = [
        { timestamp: new Date('2023-01-01T00:00:00Z'), value: 100 },
        { timestamp: new Date('2023-01-01T01:00:00Z'), value: 200 },
      ];
      const unit = Unit.kWh;
      const organizationId = 1;

      await service.storeEnergy(externalId, reads, unit, organizationId);

      expect(eventBus.publish).toHaveBeenCalledTimes(reads.length);

      for (const read of reads) {
        const startTime = DateTime.fromJSDate(read.timestamp)
          .minus({ minutes: 30 })
          .toJSDate();
        const endTime = DateTime.fromJSDate(read.timestamp).toJSDate();

        expect(eventBus.publish).toHaveBeenCalledWith(
          new GenerationReadingStoredEvent({
            deviceId: externalId,
            energyValue: BigNumber.from(read.value),
            fromTime: startTime,
            toTime: endTime,
            organizationId: organizationId.toString(),
          })
        );
      }
    });
  });
});
