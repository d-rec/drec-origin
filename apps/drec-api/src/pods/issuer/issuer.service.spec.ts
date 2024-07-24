import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from '../organization/organization.service';
import { IssuerService } from './issuer.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import { ReadsService } from '../reads/reads.service';
import { DeviceService } from '../device';
import { HttpService } from '@nestjs/axios';
import { OffChainCertificateService } from '@energyweb/origin-247-certificate';
import { BASE_READ_SERVICE } from '../reads/const';

describe('IssuerService', () => {
  let service: IssuerService;
  let groupService: DeviceGroupService;
  let deviceService: DeviceService;
  let organizationService: OrganizationService;
  let readservice: ReadsService;
  let httpService: HttpService;
  let offChainCertificateService: OffChainCertificateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuerService,
        {
          provide: DeviceGroupService,
          useValue: {} as any,
        },
        {
          provide: DeviceService,
          useValue: {} as any,
        },
        {
          provide: OrganizationService,
          useValue: {} as any,
        },
        {
          provide: ReadsService,
          useValue: {} as any,
        },
        {
          provide: BASE_READ_SERVICE,
          useValue: {} as any,
        },
        {
          provide: HttpService,
          useValue: {} as any,
        },
        {
          provide: OffChainCertificateService,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<IssuerService>(IssuerService);
    groupService = module.get<DeviceGroupService>(DeviceGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
