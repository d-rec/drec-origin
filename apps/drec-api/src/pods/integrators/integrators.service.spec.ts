import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from '../organization/organization.service';
import { DeviceService } from '../device';
import { HttpService } from '@nestjs/axios';
import { BASE_READ_SERVICE } from '../reads/const';
import { IntegratorsService } from './integrators.service';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';

describe('IntegratorsService', () => {
  let service: IntegratorsService;
  let httpService: HttpService;
  let deviceService: DeviceService;
  let configService: ConfigService;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegratorsService,
        {
          provide: HttpService,
          useValue: {} as any,
        },
        {
          provide: DeviceService,
          useValue: {} as any,
        },
        {
          provide: BASE_READ_SERVICE,
          useValue: {} as any,
        },
        ConfigService,

        {
          provide: EventBus,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<IntegratorsService>(IntegratorsService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
