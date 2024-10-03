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
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { Role } from 'src/utils/enums';
import { ILoggedInUser } from 'src/models';
import { UnreservedDeviceGroupsFilterDTO } from './dto';
import { CertificateSettingEntity } from './certificate_setting.entity';

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
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 1, name: 'Organization Name' }),
          } as any,
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest
              .fn()
              .mockResolvedValue({ role: Role.OrganizationAdmin }),
          } as any,
        },
        {
          provide: DeviceService,
          useValue: {
            findForGroup: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
          } as any,
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
        {
          provide: getRepositoryToken(CertificateSettingEntity),
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

  describe('getAll', () => {
    it('should return all device groups with default parameters', async () => {
      const deviceGroups = [
        {
          id: 1,
          name: 'Test Group',
          countryCode: ['US'],
          deviceIdsInt: [1, 2],
          organizationId: 1,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(repository, 'createQueryBuilder').mockImplementation(() => {
        return {
          innerJoin: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([deviceGroups, 1]),
        } as any;
      });

      const result = await service.getAll();
      expect(result).toEqual({
        groupedData: deviceGroups,
        currentPage: undefined,
        totalPages: NaN,
        totalCount: 1,
      });
    });

    it('should filter device groups by apiuserId when user is admin', async () => {
      const user = {
        id: 1,
        role: Role.User, // Non-admin role
        api_user_id: 'different_api_user_id', // Different from the organization's api_user_id
        organizationId: 2, // Different organizationId
        email: 'user@example.com',
        blockchainAccountAddress: '0x123',
      } as ILoggedInUser;
      const apiuserId = 'admin123';
      const deviceGroups = [
        {
          id: 1,
          name: 'Test Group',
          api_user_id: 'admin123',
          countryCode: ['US'],
          deviceIdsInt: [1, 2],
          organizationId: 1,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(repository, 'createQueryBuilder').mockImplementation(() => {
        return {
          innerJoin: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([deviceGroups, 1]),
        } as any;
      });

      const result = await service.getAll(user, undefined, apiuserId);
      expect(result).toEqual({
        groupedData: deviceGroups,
        currentPage: undefined,
        totalPages: NaN,
        totalCount: 1,
      });
    });
    /*  
    it('should throw a ConflictException when start date is provided without end date', async () => {
      const filterDto = {
        start_date: new Date('2023-01-01'),
        end_date: null,
        name: undefined,
        country: undefined,
        fuelCode: undefined,
        offTaker: undefined,
        sdgbenefit: undefined,
        reservationActive: undefined,
      };
    
      jest.spyOn(repository, 'createQueryBuilder').mockImplementation(() => {
        return {
          innerJoin: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),  // Mock with empty result
        } as any;
      });
          
      // Ensure service throws ConflictException when only start_date is provided
      await expect(
        service.getAll(undefined, undefined, undefined, undefined, undefined, filterDto)
      ).rejects.toThrow(ConflictException);
    }); 

    it('should throw a ConflictException when start date is not less than end date', async () => {
      const filterDto = {
        start_date: new Date('2023-01-01'),
        end_date: null,
        name: undefined,
        country: undefined,
        fuelCode: undefined,
        offTaker: undefined,
        sdgbenefit: undefined,
        reservationActive: undefined,
      };
  
      await expect(service.getAll(undefined, undefined, undefined, undefined, undefined, filterDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should filter device groups by country', async () => {
      const filterDto = { country: 'US' };
      const deviceGroups = [
        {
          id: 1,
          name: 'Test Group',
          countryCode: ['US'],
          deviceIdsInt: [1, 2],
          organizationId: 1,
          createdAt: new Date(),
        },
      ];
  
      jest.spyOn(repository, 'createQueryBuilder').mockImplementation(() => {
        return {
          innerJoin: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([deviceGroups, 1]),
        } as any;
      });
  
      const result = await service.getAll(undefined, undefined, undefined, undefined, undefined, filterDto);
      expect(result).toEqual({
        groupedData: deviceGroups,
        currentPage: undefined,
        totalPages: NaN,
        totalCount: 1,
      });
    }); */
  });

  describe('findById', () => {
    it('should successfully return a device group when found', async () => {
      const deviceGroupId = 1;
      const mockDeviceGroup = {
        id: deviceGroupId,
        organizationId: 2,
        deviceIdsInt: [1, 2],
      } as DeviceGroup;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDeviceGroup);
      jest.spyOn(organizationService, 'findOne').mockResolvedValue({
        name: 'Test Org',
        blockchainAccountAddress: '0x123',
      } as any);
      jest
        .spyOn(deviceService, 'findForGroup')
        .mockResolvedValue([{ id: 1 }, { id: 2 }] as any);

      const result = await service.findById(deviceGroupId);

      expect(result).toEqual({
        ...mockDeviceGroup,
        devices: [{ id: 1 }, { id: 2 }],
        organization: { name: 'Test Org', blockchainAccountAddress: '0x123' },
      });
    });

    it('should throw NotFoundException if no device group is found', async () => {
      const deviceGroupId = 1;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById(deviceGroupId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if an API user tries to access a device group not belonging to their organization', async () => {
      const deviceGroupId = 1;
      const mockDeviceGroup = {
        id: deviceGroupId,
        organizationId: 2,
        deviceIdsInt: [1, 2],
      } as DeviceGroup;
      const mockUser = {
        role: Role.ApiUser,
        organizationId: 1,
      } as ILoggedInUser;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDeviceGroup);
      jest
        .spyOn(organizationService, 'findOne')
        .mockResolvedValue({ orgEmail: 'org@example.com' } as any);
      jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValue({ role: Role.OrganizationAdmin } as any);
      jest
        .spyOn(service, 'checkdeveloperorganization')
        .mockResolvedValue(false);

      await expect(service.findById(deviceGroupId, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow access if an API user is part of the organization', async () => {
      const deviceGroupId = 1;
      const mockDeviceGroup = {
        id: deviceGroupId,
        organizationId: 1,
        deviceIdsInt: [1, 2],
      } as DeviceGroup;
      const mockUser = {
        role: Role.ApiUser,
        organizationId: 1,
      } as ILoggedInUser;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDeviceGroup);
      jest
        .spyOn(organizationService, 'findOne')
        .mockResolvedValue({ orgEmail: 'org@example.com' } as any);
      jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValue({ role: Role.OrganizationAdmin } as any);
      jest.spyOn(service, 'checkdeveloperorganization').mockResolvedValue(true);

      const result = await service.findById(deviceGroupId, mockUser);

      expect(result).toEqual(mockDeviceGroup);
    });

    it('should throw UnauthorizedException if a buyer tries to access a device group from another organization', async () => {
      const deviceGroupId = 1;
      const mockDeviceGroup = {
        id: deviceGroupId,
        organizationId: 2,
        deviceIdsInt: [1, 2],
      } as DeviceGroup;
      const mockUser = {
        role: Role.Buyer,
        organizationId: 1,
      } as ILoggedInUser;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDeviceGroup);
      jest.spyOn(service, 'checkdeveloperorganization').mockResolvedValue(true);

      await expect(service.findById(deviceGroupId, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getOrganizationDeviceGroups', () => {
    it('should return device groups for a given organizationId', async () => {
      const organizationId = 1;
      const mockDeviceGroups: DeviceGroup[] = [
        {
          id: 1,
          name: 'Group 1',
          organizationId: 1,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          // Add all other required fields for DeviceGroup entity
          devicegroup_uid: 'uid-1',
          yieldValue: 100,
          deviceIdsInt: [1, 2],
          api_user_id: 'user123',
          countryCode: ['IND'],
          fuelCode: ['TS100'],
          deviceTypeCodes: ['type1'],
          offTakers: ['Agriculture'],
          gridInterconnection: true,
          aggregatedCapacity: 200,
          capacityRange: 'firstRange',
          commissioningDateRange: ['Year_3'],
          buyerId: 2,
          buyerAddress: 'buyers addr',
          leftoverReads: 90,
          reservationExpiryDate: new Date('2024-08-30'),
        } as unknown as DeviceGroup,
        {
          id: 2,
          name: 'Group 2',
          organizationId: 1,
          createdAt: new Date('2024-02-01T00:00:00Z'),
          // Add all other required fields for DeviceGroup entity
          devicegroup_uid: 'uid-2',
          yieldValue: 200,
          deviceIdsInt: [3, 4],
          api_user_id: 'user456',
          countryCode: ['IND'],
          fuelCode: ['TS200'],
          deviceTypeCodes: ['type2'],
          offTakers: ['Industry'],
          gridInterconnection: false,
          aggregatedCapacity: 300,
          capacityRange: 'secondRange',
          commissioningDateRange: ['Year_2'],
          buyerId: 3,
          buyerAddress: 'buyer addr 2',
          leftoverReads: 100,
          reservationExpiryDate: new Date('2024-08-31'),
        } as unknown as DeviceGroup,
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockDeviceGroups);

      const result = await service.getOrganizationDeviceGroups(organizationId);

      expect(result).toEqual(mockDeviceGroups);
      expect(repository.find).toHaveBeenCalledWith({
        where: { organizationId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return an empty array if no device groups are found', async () => {
      const organizationId = 1;

      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.getOrganizationDeviceGroups(organizationId);

      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { organizationId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle errors from the repository', async () => {
      const organizationId = 1;
      const error = new Error('Repository error');

      jest.spyOn(repository, 'find').mockRejectedValue(error);

      await expect(
        service.getOrganizationDeviceGroups(organizationId),
      ).rejects.toThrow(error);
    });
  });

  describe('getBuyerDeviceGroups', () => {
    it('should return device groups for a given buyerId without filters', async () => {
      const buyerId = 1;
      const mockDeviceGroups: any = [
        {
          dg_id: 1,
          dg_name: 'Group 1',
          dg_organizationId: 1,
          dg_countryCode: ['IND'],
          dg_fuelCode: ['TS100'],
          dg_deviceTypeCodes: ['type1'],
          dg_offTakers: ['Agriculture'],
          dg_gridInterconnection: true,
          dg_aggregatedCapacity: 200,
          dg_commissioningDateRange: ['Year_3'],
          dg_buyerId: 1,
          dg_buyerAddress: 'buyers addr',
          dg_leftoverReads: 90,
          dg_reservationStartDate: new Date('2024-08-01'),
          dg_reservationEndDate: new Date('2024-08-30'),
          dg_reservationActive: true,
          dg_targetVolumeInMegaWattHour: 100,
          dg_targetVolumeCertificateGenerationRequestedInMegaWattHour: 80,
          dg_targetVolumeCertificateGenerationSucceededInMegaWattHour: 70,
          dg_targetVolumeCertificateGenerationFailedInMegaWattHour: 10,
          dg_authorityToExceed: false,
          dg_leftoverReadsByCountryCode: { IND: 30 },
          dg_devicegroup_uid: 'UID-123',
          dg_type: 'typeA',
          dg_deviceIdsInt: [1, 2],
          sdgBenefits: ['Benefit1', 'Benefit2'],
        },
      ];

      const mockCount = 1;

      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockDeviceGroups),
        getSql: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(mockCount),
      } as any);

      // Calling the service function with necessary parameters
      const result = await service.getBuyerDeviceGroups(buyerId, 1);

      expect(result.groupedData).toEqual([
        {
          id: 1,
          name: 'Group 1',
          organizationId: 1,
          countryCode: ['IND'],
          fuelCode: ['TS100'],
          deviceTypeCodes: ['type1'],
          offTakers: ['Agriculture'],
          gridInterconnection: true,
          aggregatedCapacity: 200,
          commissioningDateRange: ['Year_3'],
          buyerId: 1,
          buyerAddress: 'buyers addr',
          leftoverReads: 90,
          reservationStartDate: new Date('2024-08-01'),
          reservationEndDate: new Date('2024-08-30'),
          reservationActive: true,
          targetVolumeInMegaWattHour: 100,
          targetVolumeCertificateGenerationRequestedInMegaWattHour: 80,
          targetVolumeCertificateGenerationSucceededInMegaWattHour: 70,
          targetVolumeCertificateGenerationFailedInMegaWattHour: 10,
          authorityToExceed: false,
          leftoverReadsByCountryCode: { IND: 30 },
          devicegroup_uid: 'UID-123',
          type: 'typeA',
          deviceIds: [1, 2],
          SDGBenefits: ['Benefit1', 'Benefit2'],
        },
      ]);

      expect(result.pageNumber).toEqual(1);
      expect(result.totalPages).toEqual(1);
      expect(result.totalCount).toEqual(mockCount);
    });
    it('should throw ConflictException when end date is before start date', async () => {
      const buyerId = 1;

      // Add all required properties to groupfilterDto
      const groupfilterDto = {
        name: null, // Adjust based on the actual type, use '' or null if appropriate
        country: null, // Same here, adjust accordingly
        fuelCode: null,
        offTaker: null,
        type: null,
        deviceTypeCodes: null,
        start_date: '2024-08-01',
        end_date: '2024-07-01',
      };

      // Mocking createQueryBuilder and its chained methods if needed
      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      } as any);

      await expect(
        service.getBuyerDeviceGroups(
          buyerId,
          1,
          groupfilterDto as unknown as UnreservedDeviceGroupsFilterDTO,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw HttpException if page number is out of range', async () => {
      const buyerId = 1;
      const mockDeviceGroups: any = [];
      const mockCount = 10;

      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockDeviceGroups),
        getSql: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(mockCount),
      } as any);

      await expect(service.getBuyerDeviceGroups(buyerId, 100)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a DeviceGroup when found', async () => {
      const mockDeviceGroup = { id: 1, name: 'Group 1' } as DeviceGroup;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDeviceGroup);

      const result = await service.findOne({ id: 1 });

      expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockDeviceGroup);
    });

    it('should return null when no DeviceGroup is found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne({ id: 999 });

      expect(repository.findOne).toHaveBeenCalledWith({ id: 999 });
      expect(result).toBeNull();
    });

    it('should handle errors when findOne throws an error', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.findOne({ id: 1 })).rejects.toThrow(
        'Database error',
      );

      expect(repository.findOne).toHaveBeenCalledWith({ id: 1 });
    });
  });
});
