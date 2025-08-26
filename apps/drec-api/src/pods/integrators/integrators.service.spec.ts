/* eslint-disable @typescript-eslint/no-unused-vars */

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { BigNumber } from 'ethers';
import { of, throwError } from 'rxjs';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import {
  MeasurementDTO,
  ReadDTO,
  Unit,
} from '../../types/reads';
import { ReadType } from '../../utils/enums';
import { DeviceService } from '../device/device.service';
import { ReadsService } from '../reads/reads.service';
import { IntegratorsService } from './integrators.service';

describe('IntegratorsService', () => {
  let service: IntegratorsService;
  let httpService: HttpService;
  let deviceService: DeviceService;
  let configService: ConfigService;
  let eventBus: EventBus;
  let readsService: ReadsService;

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
    readsService = module.get<ReadsService>(ReadsService);
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
        headers: {},
        config: {},
        status: 200,
        statusText: 'OK',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse) as any);
      const result = await service.loginBBOX(server, loginForm);

      expect(httpService.post).toHaveBeenCalledWith(
        `${server}/v1/auth/login`,
        loginForm,
        { headers: loginForm.getHeaders() },
      );
      expect(result).toEqual(apiToken);
    });
  });

  describe('getBBOXProductReadData', () => {
    it('should return energy_out data successfully', async () => {
      const server = 'http://example.com';
      const token = 'test_token';
      const productId = '1234';
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const mockData = {
        data: { data: { energy_out: 5000 } },
        headers: {},
        config: {},
        status: 200,
        statusText: 'OK',
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockData) as any);

      const result = await service.getBBOXProductReadData(
        server,
        token,
        productId,
        startDate,
        endDate,
      );

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
        },
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

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error(errorMessage)));

      await expect(
        service.getBBOXProductReadData(
          server,
          token,
          productId,
          startDate,
          endDate,
        ),
      ).rejects.toThrow(errorMessage);

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
        },
      );
    });
  });

  describe('storeBBOXEnergyReads', () => {
    it('should log and return when no energy data is found', async () => {
      const server = 'http://example.com';
      const authToken = 'test_token';
      const externalId = '1234';
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const organizationId = 1;

      const getBBOXProductReadDataSpy = jest
        .spyOn(service, 'getBBOXProductReadData')
        .mockResolvedValue([]);
      const storeEnergySpy = jest.spyOn(service, 'storeEnergy');

      await service.storeBBOXEnergyReads(
        server,
        authToken,
        externalId,
        startDate,
        endDate,
        organizationId,
      );

      expect(getBBOXProductReadDataSpy).toHaveBeenCalledWith(
        server,
        authToken,
        externalId,
        startDate,
        endDate,
      );
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

      const getBBOXProductReadDataSpy = jest
        .spyOn(service, 'getBBOXProductReadData')
        .mockResolvedValue(mockEnergyData);
      const storeEnergySpy = jest
        .spyOn(service, 'storeEnergy')
        .mockResolvedValue();

      await service.storeBBOXEnergyReads(
        server,
        authToken,
        externalId,
        startDate,
        endDate,
        organizationId,
      );

      expect(getBBOXProductReadDataSpy).toHaveBeenCalledWith(
        server,
        authToken,
        externalId,
        startDate,
        endDate,
      );
      expect(storeEnergySpy).toHaveBeenCalledWith(
        externalId,
        [
          {
            timestamp: new Date(mockEnergyData[0][1]),
            value: parseFloat(mockEnergyData[0][0]),
          },
        ],
        Unit.kWh,
        organizationId,
      );
    });
  });

  describe('storeEnergy', () => {
    it('should log measurements and call readsService.store', async () => {
      const externalId = 'device123';
      const reads: ReadDTO[] = [
        { startDate: new Date('2023-01-01T00:00:00Z'), endDate: new Date('2023-01-01T00:30:00Z'), value: 100 },
      ];
      const unit = Unit.kWh;
      const organizationId = 1;

      await service.storeEnergy(externalId, reads, unit, organizationId);

      const measurement: MeasurementDTO = {
        reads,
        unit,
        type: ReadType.Delta,
      }

      expect(readsService.store).toHaveBeenCalledWith(
        externalId,
        measurement,
      );
    });

    it('should publish GenerationReadingStoredEvent for each read', async () => {
      const externalId = 'device123';
      const reads: ReadDTO[] = [
        { startDate: new Date('2023-01-01T00:00:00Z'), endDate: new Date('2023-01-01T00:30:00Z'), value: 100 },
        { startDate: new Date('2023-01-01T01:00:00Z'), endDate: new Date('2023-01-01T01:30:00Z'), value: 200 },
      ];
      const unit = Unit.kWh;
      const organizationId = 1;

      await service.storeEnergy(externalId, reads, unit, organizationId);

      expect(eventBus.publish).toHaveBeenCalledTimes(reads.length);

      for (const read of reads) {
        expect(eventBus.publish).toHaveBeenCalledWith(
          new GenerationReadingStoredEvent({
            deviceId: externalId,
            energyValue: BigNumber.from(read.value),
            fromTime: read.startDate,
            toTime: read.endDate,
            organizationId: organizationId.toString(),
          }),
        );
      }
    });
  });
});
