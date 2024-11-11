import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { CertificateLogService } from './certificate-log.service';
import { Certificate } from '@energyweb/issuer-api';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import { DeviceService } from '../device';
import { DeviceGroupService } from '../device-group/device-group.service';
import { Response } from 'express';
import { ILoggedInUser } from '../../models/LoggedInUser';
import {
  DevicetypeCode,
  FuelCode,
  OffTaker,
  PermissionString,
  Role,
} from '../../utils/enums';
import { FilterDTO } from './dto/filter.dto';
import { CertificatelogResponse } from './dto';

describe('CertificateLogService', () => {
  let service: CertificateLogService;
  let repository: Repository<CheckCertificateIssueDateLogForDeviceEntity>;
  let certificaterrepository: Repository<Certificate>;
  let certificateReadModelEntity: Repository<CertificateReadModelEntity<any>>;
  let mockResponse: Partial<Response>;
  let deviceService: DeviceService;
  let devicegroupService: DeviceGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificateLogService,
        {
          provide: getRepositoryToken(
            CheckCertificateIssueDateLogForDeviceEntity,
          ),
          useClass: Repository,
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              leftJoin: jest.fn().mockReturnThis(),
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getRawMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Certificate),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CertificateReadModelEntity),
          useClass: Repository,
        },
        {
          provide: DeviceService,
          useValue: {} as any,
        },
        {
          provide: DeviceGroupService,
          useValue: {
            getReservationInforDeveloperBsise: jest.fn(),
            getoldReservationInforDeveloperBsise: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    service = module.get<CertificateLogService>(CertificateLogService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    repository = module.get<
      Repository<CheckCertificateIssueDateLogForDeviceEntity>
    >(getRepositoryToken(CheckCertificateIssueDateLogForDeviceEntity));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    certificaterrepository = module.get<Repository<Certificate>>(
      getRepositoryToken(Certificate),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    certificateReadModelEntity = module.get<
      Repository<CertificateReadModelEntity<any>>
    >(getRepositoryToken(CertificateReadModelEntity));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deviceService = module.get<DeviceService>(DeviceService);
    devicegroupService = module.get<DeviceGroupService>(DeviceGroupService);

    mockResponse = {
      setHeader: jest.fn(),
      write: jest
        .fn()
        .mockImplementation((data, encoding, callback) => callback()),
      end: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCSV', () => {
    it('should create CSV file and send it as response', async () => {
      const mockData: CheckCertificateIssueDateLogForDeviceEntity[] = [
        {
          id: 1,
          certificate_issuance_startdate: new Date('2023-11-06T12:48:18.405Z'),
          certificate_issuance_enddate: new Date('2023-11-10T04:15:58.000Z'),
          readvalue_watthour: 10000,
          certificateTransactionUID: '14f8bcd3-095b-4659-90d8-bbc7523d14b4',
          externalId: 'Ext2',
          groupId: 2,
          status: 'Active',
          ongoing_start_date: '2023-11-06T12:48:18.405Z',
          ongoing_end_date: '2023-11-10T04:15:58.000Z',
        } as CheckCertificateIssueDateLogForDeviceEntity,
        {
          id: 2,
          certificate_issuance_startdate: new Date('2023-11-06T12:48:18.405Z'),
          certificate_issuance_enddate: new Date('2023-11-09T04:15:58.000Z'),
          readvalue_watthour: 10000,
          certificateTransactionUID: '37aa312a-405d-4e37-97f3-8af06a0b1e10',
          externalId: 'Ext2',
          groupId: 3,
          status: 'Active',
          ongoing_start_date: '2023-11-06T12:48:18.405Z',
          ongoing_end_date: '2023-11-10T04:15:58.000Z',
        } as CheckCertificateIssueDateLogForDeviceEntity,
        {
          id: 3,
          certificate_issuance_startdate: new Date('2022-11-26T11:01:00.000Z'),
          certificate_issuance_enddate: new Date('2023-11-06T08:27:44.000Z'),
          readvalue_watthour: 10000,
          certificateTransactionUID: '770d39fd-fbb3-4eb9-82df-260a740b5151',
          externalId: 'Ext2',
          groupId: 4,
          status: 'Pending',
          ongoing_start_date: '2023-11-06T12:48:18.405Z',
          ongoing_end_date: '2023-11-10T04:15:58.000Z',
        } as CheckCertificateIssueDateLogForDeviceEntity,
      ];

      jest
        .spyOn(service, 'Findperdevicecertificatelog')
        .mockResolvedValue(mockData);

      await service.createCSV(mockResponse as Response, 1, 1, 'Certificates');

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=Certificates ' +
          new Date().toLocaleDateString() +
          '.csv',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.write).toHaveBeenCalledTimes(1);
      expect(mockResponse.end).toHaveBeenCalledTimes(1);
    });

    it('should handle errors and throw HttpException', async () => {
      jest
        .spyOn(service, 'Findperdevicecertificatelog')
        .mockRejectedValue(new Error('Test error'));

      await expect(
        service.createCSV(mockResponse as Response, 1, 1, 'Certificates'),
      ).rejects.toThrowError('Devices log Not found');

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(mockResponse.write).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });
  });

  describe('Findperdevicecertificatelog', () => {
    it('should return certificate logs for the provided group and organization', async () => {
      const groupId = 1;
      const organizationId = 1;

      const expectedLogs: CheckCertificateIssueDateLogForDeviceEntity[] = [
        {
          id: 1,
          groupId: 2,
          certificate_issuance_startdate: new Date('2023-11-06T12:48:18.405Z'),
          certificate_issuance_enddate: new Date('2023-11-10T04:15:58.000Z'),
          readvalue_watthour: 10000,
          certificateTransactionUID: '14f8bcd3-095b-4659-90d8-bbc7523d14b4',
          externalId: 'Ext2',
          status: 'Active',
          ongoing_start_date: '2023-11-06T12:48:18.405Z',
          ongoing_end_date: '2023-11-10T04:15:58.000Z',
        } as CheckCertificateIssueDateLogForDeviceEntity,
        {
          id: 2,
          groupId: 3,
          certificate_issuance_startdate: new Date('2023-11-06T12:48:18.405Z'),
          certificate_issuance_enddate: new Date('2023-11-09T04:15:58.000Z'),
          readvalue_watthour: 10000,
          certificateTransactionUID: '37aa312a-405d-4e37-97f3-8af06a0b1e10',
          externalId: 'Ext2',
          status: 'pending',
          ongoing_start_date: '2023-11-06T12:48:18.405Z',
          ongoing_end_date: '2023-11-09T04:15:58.000Z',
        } as CheckCertificateIssueDateLogForDeviceEntity,
        {
          id: 3,
          groupId: 4,
          certificate_issuance_startdate: new Date('2022-11-26T11:01:00.000Z'),
          certificate_issuance_enddate: new Date('2023-11-06T08:27:44.000Z'),
          readvalue_watthour: 10000,
          certificateTransactionUID: '770d39fd-fbb3-4eb9-82df-260a740b5151',
          externalId: 'Ext2',
          status: 'pending',
          ongoing_start_date: '2023-11-06T12:48:18.405Z',
          ongoing_end_date: '2023-11-09T04:15:58.000Z',
        } as CheckCertificateIssueDateLogForDeviceEntity,
      ];

      jest
        .spyOn(service, 'Findperdevicecertificatelog')
        .mockResolvedValueOnce(expectedLogs);

      const result = await service.Findperdevicecertificatelog(
        groupId,
        organizationId,
      );

      expect(result).toEqual(expectedLogs);
      expect(service.Findperdevicecertificatelog).toHaveBeenCalledWith(
        groupId,
        organizationId,
      );
    });

    it('should handle error for invalid group id', async () => {
      const groupId = 1.3;
      const organizationId = 4;
      jest
        .spyOn(service, 'Findperdevicecertificatelog')
        .mockRejectedValueOnce(new Error('Invalid group id'));

      await expect(
        service.Findperdevicecertificatelog(groupId, organizationId),
      ).rejects.toThrowError('Invalid group id');
      expect(service.Findperdevicecertificatelog).toHaveBeenCalledWith(
        groupId,
        organizationId,
      );
    });

    it('should handle error for invalid organization id', async () => {
      const groupId = 1;
      const organizationId = 4.5;
      jest
        .spyOn(service, 'Findperdevicecertificatelog')
        .mockRejectedValueOnce(new Error('Invalid organization id'));

      await expect(
        service.Findperdevicecertificatelog(groupId, organizationId),
      ).rejects.toThrowError('Invalid organization id');
      expect(service.Findperdevicecertificatelog).toHaveBeenCalledWith(
        groupId,
        organizationId,
      );
    });
  });

  describe('getCertifiedlogofDevices', () => {
    it('should return old certificates when old reservation information is available', async () => {
      const user: ILoggedInUser = {
        id: 2,
        organizationId: 2,
        email: 'testsweya@gmail.com',
        blockchainAccountAddress: undefined,
        role: Role.OrganizationAdmin,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hasRole: function (...role: Role[]): boolean {
          throw new Error('Function not implemented.');
        },
        ownerId: '',
        hasOrganization: false,
        permissions: PermissionString.Write,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hasPermission: function (...permissions: PermissionString[]): boolean {
          throw new Error('Function not implemented.');
        },
        api_user_id: 'apiuserId',
      };

      const filterDto: FilterDTO = {
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DevicetypeCode.TC110,
        fromAmountread: 20,
        toAmountread: 1500,
        offTaker: OffTaker.Education,
        start_date: '2020-01-01 00:00:000Z',
        end_date: '2024-02-14 12:51:000Z',
        country: 'India',
        SDGBenefits: undefined,
        oldcertificatelog: true, // Ensure old certificate log is true
      };

      const pageNumber = 1;

      const getoldreservationinfo = {
        deviceGroups: [
          {
            dg_id: 2,
            name: 'secondreservation',
            deviceIdsInt: [1, 2],
            internalCertificateId: [],
          },
          {
            dg_id: 3,
            name: 'thirdreservation',
            deviceIdsInt: [2, 3],
            internalCertificateId: [],
          },
          {
            dg_id: 4,
            name: 'fourthreservation',
            deviceIdsInt: [4, 5],
            internalCertificateId: [],
          },
        ],
      };

      const getnewreservationinfo = { deviceGroups: [] };

      const getReservationInforDeveloperBsiseSpy = jest
        .spyOn(devicegroupService, 'getReservationInforDeveloperBsise')
        .mockResolvedValueOnce(getnewreservationinfo);

      const getoldReservationInforDeveloperBsiseSpy = jest
        .spyOn(devicegroupService, 'getoldReservationInforDeveloperBsise')
        .mockResolvedValueOnce(getoldreservationinfo);

      const expectedCertificates = {
        certificatelog: [
          {
            certificate_issuance_startdate: new Date(
              '2023-11-06T12:48:18.405Z',
            ),
            certificate_issuance_enddate: new Date('2023-11-10T04:15:58.000Z'),
            readvalue_watthour: 10000,
            certificateTransactionUID: '14f8bcd3-095b-4659-90d8-bbc7523d14b4',
            reservation_name: 'secondreservation',
            externalId: 'Ext2',
            blockchainCertificateId: 3,
          },
          {
            certificate_issuance_startdate: new Date(
              '2023-11-06T12:48:18.405Z',
            ),
            certificate_issuance_enddate: new Date('2023-11-09T04:15:58.000Z'),
            readvalue_watthour: 10000,
            certificateTransactionUID: '37aa312a-405d-4e37-97f3-8af06a0b1e10',
            reservation_name: 'secondreservation',
            externalId: 'Ext2',
            blockchainCertificateId: 2,
          },
          {
            certificate_issuance_startdate: new Date(
              '2022-11-26T11:01:00.000Z',
            ),
            certificate_issuance_enddate: new Date('2023-11-06T08:27:44.000Z'),
            readvalue_watthour: 10000,
            certificateTransactionUID: '770d39fd-fbb3-4eb9-82df-260a740b5151',
            reservation_name: 'secondreservation',
            externalId: 'Ext2',
            blockchainCertificateId: 1,
          },
        ],
        currentpage: 1,
        totalPages: 1,
        totalCount: 1,
        oldcertificatelog: true, // Add this key to match the actual result
      };

      jest
        .spyOn(service, 'getDeveloperfindreservationcertified')
        .mockResolvedValueOnce(
          expectedCertificates as unknown as CertificatelogResponse,
        );

      const result = await service.getCertifiedlogofDevices(
        user,
        filterDto,
        pageNumber,
      );

      expect(getReservationInforDeveloperBsiseSpy).toHaveBeenCalledWith(
        user.organizationId,
        user.role,
        filterDto,
        pageNumber,
        user.api_user_id,
      );

      expect(getoldReservationInforDeveloperBsiseSpy).toHaveBeenCalledWith(
        user.organizationId,
        user.role,
        filterDto,
        pageNumber,
        user.api_user_id,
      );

      expect(result).toEqual(expectedCertificates); // Assert that expected certificates are returned
    });

    it('should return new certificates when new reservation information is available', async () => {
      const user: ILoggedInUser = {
        id: 2,
        organizationId: 2,
        email: 'testsweya@gmail.com',
        blockchainAccountAddress: undefined,
        role: Role.OrganizationAdmin,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hasRole: function (...role: Role[]): boolean {
          throw new Error('Function not implemented.');
        },
        ownerId: '',
        hasOrganization: false,
        permissions: PermissionString.Write,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hasPermission: function (...permissions: PermissionString[]): boolean {
          throw new Error('Function not implemented.');
        },
        api_user_id: 'apiuserId',
      };

      const filterDto: FilterDTO = {
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DevicetypeCode.TC110,
        fromAmountread: 20,
        toAmountread: 1500,
        offTaker: OffTaker.Education,
        start_date: '2020-01-01 00:00:000Z',
        end_date: '2024-02-14 12:51:000Z',
        country: 'India',
        SDGBenefits: undefined,
      };

      const pageNumber = 1;

      const getoldreservationinfo = { deviceGroups: [] };

      const getnewreservationinfo = {
        deviceGroups: [
          {
            dg_id: 5,
            name: 'secondreservation',
            deviceIdsInt: [1, 2],
            internalCertificateId: [],
          },
          {
            dg_id: 6,
            name: 'thirdreservation',
            deviceIdsInt: [2, 3],
            internalCertificateId: [],
          },
          {
            dg_id: 7,
            name: 'fourthreservation',
            deviceIdsInt: [4, 5],
            internalCertificateId: [],
          },
        ],
      };

      jest
        .spyOn(devicegroupService, 'getReservationInforDeveloperBsise')
        .mockResolvedValueOnce(getnewreservationinfo);
      jest
        .spyOn(devicegroupService, 'getoldReservationInforDeveloperBsise')
        .mockResolvedValueOnce(getoldreservationinfo);

      const expectedCertificates = {
        certificatelog: [
          {
            certificate_issuance_startdate: new Date(
              '2023-11-06T12:48:18.405Z',
            ),
            certificate_issuance_enddate: new Date('2023-11-10T04:15:58.000Z'),
            readvalue_watthour: 10000,
            certificateTransactionUID: '14f8bcd3-095b-4659-90d8-bbc7523d14b4',
            reservation_name: 'secondreservation',
            externalId: 'Ext2',
            blockchainCertificateId: 3,
          },
          {
            certificate_issuance_startdate: new Date(
              '2023-11-06T12:48:18.405Z',
            ),
            certificate_issuance_enddate: new Date('2023-11-09T04:15:58.000Z'),
            readvalue_watthour: 10000,
            certificateTransactionUID: '37aa312a-405d-4e37-97f3-8af06a0b1e10',
            reservation_name: 'secondreservation',
            externalId: 'Ext2',
            blockchainCertificateId: 2,
          },
          {
            certificate_issuance_startdate: new Date(
              '2022-11-26T11:01:00.000Z',
            ),
            certificate_issuance_enddate: new Date('2023-11-06T08:27:44.000Z'),
            readvalue_watthour: 10000,
            certificateTransactionUID: '770d39fd-fbb3-4eb9-82df-260a740b5151',
            reservation_name: 'secondreservation',
            externalId: 'Ext2',
            blockchainCertificateId: 1,
          },
        ],
        currentpage: 1,
        totalPages: 1,
        totalCount: 1,
        oldcertificatelog: false, // Add this key to match the actual result
      };

      jest
        .spyOn(
          service,
          'getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247',
        )
        .mockResolvedValueOnce(
          expectedCertificates as unknown as CertificatelogResponse,
        );

      const result = await service.getCertifiedlogofDevices(
        user,
        filterDto,
        pageNumber,
      );

      expect(result).toEqual(expectedCertificates);
    });

    it('should return empty certificates when both old and new reservation information are unavailable', async () => {
      const user: ILoggedInUser = {
        id: 2,
        organizationId: 2,
        email: 'testsweya@gmail.com',
        blockchainAccountAddress: undefined,
        role: Role.OrganizationAdmin,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hasRole: function (...role: Role[]): boolean {
          throw new Error('Function not implemented.');
        },
        ownerId: '',
        hasOrganization: false,
        permissions: PermissionString.Write,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hasPermission: function (...permissions: PermissionString[]): boolean {
          throw new Error('Function not implemented.');
        },
        api_user_id: 'apiuserId',
      };

      const filterDto: FilterDTO = {
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DevicetypeCode.TC110,
        fromAmountread: 20,
        toAmountread: 1500,
        offTaker: OffTaker.Education,
        start_date: '2020-01-01 00:00:000Z',
        end_date: '2024-02-14 12:51:000Z',
        country: 'India',
        SDGBenefits: undefined,
      };

      const pageNumber = 1;

      const getreservationinfo = { deviceGroups: [] };

      jest
        .spyOn(devicegroupService, 'getReservationInforDeveloperBsise')
        .mockResolvedValueOnce(getreservationinfo);
      jest
        .spyOn(devicegroupService, 'getoldReservationInforDeveloperBsise')
        .mockResolvedValueOnce(getreservationinfo);

      const expectedCertificates = {
        certificatelog: [],
        currentpage: 0,
        totalPages: 0,
        totalCount: 0,
        oldcertificatelog: false, // Include this to match the actual result
      };

      const result = await service.getCertifiedlogofDevices(
        user,
        filterDto,
        pageNumber,
      );

      expect(result).toEqual(expectedCertificates);
    });
  });
});
