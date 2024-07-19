import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { DeviceGroupService } from './device-group.service';
import { DeviceGroup } from './device-group.entity';
import { DeviceCsvProcessingFailedRowsEntity } from './device_csv_processing_failed_rows.entity';
import { DeviceCsvFileProcessingJobsEntity } from './device_csv_processing_jobs.entity';
import { DeviceGroupNextIssueCertificate } from './device_group_issuecertificate.entity';
import { FileService } from '../file';
import { YieldConfigService } from '../yield-config/yieldconfig.service';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './check_certificate_issue_date_log_for_device_group.entity';
import { HistoryDeviceGroupNextIssueCertificate } from './history_next_issuance_date_log.entity';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import { DeviceService } from '../device/device.service';
import { IrecErrorLogInformationEntity } from '../device/irec_error_log_information.entity';
import { ICertificateMetadata } from '../../utils/types';

describe('DeviceGroupService', () => {
  let service: DeviceGroupService;
  let repository: Repository<DeviceGroup>;
  let repositoryJobFailedRows: Repository<DeviceCsvProcessingFailedRowsEntity>;
  let repositoyCSVJobProcessing: Repository<DeviceCsvFileProcessingJobsEntity>;
  let repositorynextDeviceGroupcertificate: Repository<DeviceGroupNextIssueCertificate>;
  let organizationService: OrganizationService;
  let deviceService: DeviceService;
  let fileService: FileService;
  let yieldConfigService: YieldConfigService;
  let userService: UserService;
  let checkdevciegrouplogcertificaterepository: Repository<CheckCertificateIssueDateLogForDeviceGroupEntity>;
  let historynextissuancedaterepository: Repository<HistoryDeviceGroupNextIssueCertificate>;
  let certificateReadModelEntity: Repository<
    CertificateReadModelEntity<ICertificateMetadata>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceGroupService,
        {
          provide: getRepositoryToken(DeviceGroup),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DeviceCsvProcessingFailedRowsEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DeviceCsvFileProcessingJobsEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DeviceGroupNextIssueCertificate),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(IrecErrorLogInformationEntity),
          useClass: Repository,
        },
        {
          provide: OrganizationService,
          useValue: {} as any,
        },
        {
          provide: UserService,
          useValue: {} as any,
        },
        {
          provide: DeviceService,
          useValue: {} as any,
        },
        {
          provide: FileService,
          useValue: {} as any,
        },
        {
          provide: YieldConfigService,
          useValue: {} as any,
        },
        {
          provide: getRepositoryToken(
            CheckCertificateIssueDateLogForDeviceGroupEntity,
          ),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(HistoryDeviceGroupNextIssueCertificate),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CertificateReadModelEntity),
          useClass: Repository,
        },
      ],
    }).compile();
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    service = module.get<DeviceGroupService>(DeviceGroupService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    repository = module.get<Repository<DeviceGroup>>(
      getRepositoryToken(DeviceGroup),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    repositoryJobFailedRows = module.get<
      Repository<DeviceCsvProcessingFailedRowsEntity>
    >(getRepositoryToken(DeviceCsvProcessingFailedRowsEntity));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    repositoyCSVJobProcessing = module.get<
      Repository<DeviceCsvFileProcessingJobsEntity>
    >(getRepositoryToken(DeviceCsvFileProcessingJobsEntity));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    repositorynextDeviceGroupcertificate = module.get<
      Repository<DeviceGroupNextIssueCertificate>
    >(getRepositoryToken(DeviceGroupNextIssueCertificate));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    organizationService = module.get<OrganizationService>(OrganizationService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deviceService = module.get<DeviceService>(DeviceService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fileService = module.get<FileService>(FileService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    yieldConfigService = module.get<YieldConfigService>(YieldConfigService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userService = module.get<UserService>(UserService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    checkdevciegrouplogcertificaterepository = module.get<
      Repository<CheckCertificateIssueDateLogForDeviceGroupEntity>
    >(getRepositoryToken(CheckCertificateIssueDateLogForDeviceGroupEntity));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    historynextissuancedaterepository = module.get<
      Repository<HistoryDeviceGroupNextIssueCertificate>
    >(getRepositoryToken(HistoryDeviceGroupNextIssueCertificate));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    certificateReadModelEntity = module.get<
      Repository<CertificateReadModelEntity<ICertificateMetadata>>
    >(getRepositoryToken(CertificateReadModelEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
