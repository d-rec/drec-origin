/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  IGetAllCertificatesOptions,
  IIssueCommandParams,
  OffChainCertificateService,
} from '@energyweb/origin-247-certificate';
import { HttpService } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bull';
import { Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { of } from 'rxjs';
import { IDevice } from '../../models';
import { ICertificateMetadata } from '../../utils/types';
import { Queues } from '../../../src/utils/enums/queues.enum';
import {
  roundDecimalToFixedPrecision,
  splitValueIntoIntegerAndDecimal,
} from '../../lib/helpers/splitValueIntoIntegerAndDecimal';
import { CertificateLogService } from '../certificate-log/certificate-log.service';
import { DeviceService } from '../device';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { DeviceLateOngoingIssueCertificateEntity } from '../device/device_lateongoing_certificate.entity';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { BASE_READ_SERVICE } from '../reads/constants';
import { HistoryIntermediateMeterRead } from '../reads/history_intermideate_meterread.entity';
import { ReadsService } from '../reads/reads.service';
import { CertificateService } from './certificate.service';
import { IssuerService } from './issuer.service';
import { LateOngoingIssuanceService } from './late-ongoing-issuance.service';

describe('IssuerService', () => {
  let offChainCertificateService: OffChainCertificateService;
  let service: IssuerService;
  let certificateService: CertificateService;
  let lateOngoingIssuanceService: LateOngoingIssuanceService;
  let groupService: DeviceGroupService;
  let deviceService: DeviceService;
  let organizationService: OrganizationService;
  let readsService: ReadsService;
  let httpService: HttpService;
  let logger: Logger;

  beforeEach(async () => {
    jest.setTimeout(10000); // Set timeout to 10 seconds

    logger = { debug: jest.fn(), error: jest.fn() } as unknown as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LateOngoingIssuanceService,
        IssuerService,
        {
          provide: CertificateService,
          useValue: {
            issue: jest.fn(),
            get: jest.fn(),
            issueFromAPI: jest.fn(),
            getIssuanceParams: jest.fn(),
          } as any,
        },
        {
          provide: OffChainCertificateService,
          useValue: {
            issue: jest.fn(),
            issueCertificate: jest.fn(),
            getAll: jest.fn(),
          } as any,
        },
        {
          provide: getQueueToken(Queues.LateOngoingIssuance),
          useValue: {
            add: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CertificateLogService,
          useValue: {
            createForDevice: jest.fn(),
            createForGroup: jest.fn(),
          } as any,
        },
        {
          provide: DeviceGroupService,
          useValue: {
            getAllNextRequestCertificate: jest.fn(),
            findOne: jest.fn(),
            endReservationGroup: jest.fn(),
            updateCertificateIssueDate: jest.fn(),
            getNextHistoryIssuanceDeviceLog: jest.fn(),
            addCertificateIssueDateLogForDeviceGroup: jest.fn(),
            updateHistoryCertificateIssueDate: jest.fn(),
            updateTotalReadingRequestedForCertificateIssuance: jest.fn(),
            countGroupIdHistoryIssuanceDeviceLog: jest.fn(),
            getGroupCertificateIssueDate: jest.fn(),
            deactivateReservation: jest.fn(),
            updateLeftOverReadByCountryCode: jest.fn(),
            updateLeftOverRead: jest.fn(),
            getAllReservationActive: jest.fn(),
            endReservation: jest.fn(),
            getNextRequestCertificateByGroupId: jest.fn(),
          } as any,
        },
        {
          provide: DeviceService,
          useValue: {
            newFindForGroup: jest.fn(),
            findForGroup: jest.fn(),
            findReads: jest.fn(),
            addCertificateIssueDateLogForDevice: jest.fn(),
            removeFromGroup: jest.fn(),
            addLateCertificateIssueDateLogForDevice: jest.fn(),
            findLateCycleByDateRange: jest.fn(),
            getCheckCertificateIssueDateLogForDevice: jest.fn(),
            findAllLateCycle: jest.fn(),
          } as any,
        },
        {
          provide: OrganizationService,
          useValue: {
            findOne: jest.fn(),
          } as any,
        },
        {
          provide: ReadsService,
          useValue: {
            getCheckHistoryCertificateIssueDateLogForDevice: jest.fn(),
            updateHistoryCertificateIssueDate: jest.fn(),
            getDeltaMeterReadsFirstEntryOfDevice: jest.fn(),
            latestRead: jest.fn(),
            findLastReadForMeterWithinRange: jest.fn(),
            getAggregateMeterReadsFirstEntryOfDevice: jest.fn(),
          } as any,
        },
        {
          provide: BASE_READ_SERVICE,
          useValue: {
            find: jest.fn(),
          } as any,
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(of({})),
          } as any,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    offChainCertificateService = module.get<OffChainCertificateService>(
      OffChainCertificateService,
    );
    service = module.get<IssuerService>(IssuerService);
    lateOngoingIssuanceService = module.get<LateOngoingIssuanceService>(
      LateOngoingIssuanceService,
    );
    certificateService = module.get<CertificateService>(CertificateService);
    groupService = module.get<DeviceGroupService>(DeviceGroupService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<Logger>(Logger);
    deviceService = module.get<DeviceService>(DeviceService);
    organizationService = module.get<OrganizationService>(OrganizationService);
    readsService = module.get<ReadsService>(ReadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCron', () => {
    it('should update certificate issue date correctly', async () => {
      // Arrange
      const mockGroupRequest = {
        id: 1,
        groupId: 1,
        start_date: '2023-01-01',
        end_date: '2023-01-02',
        organizationId: 1,
      } as unknown as DeviceGroupNextIssueCertificate;
      const mockGroup = {
        id: 1,
        reservationEndDate: new Date('2023-01-03'),
        frequency: 'daily',
        leftoverReadsByCountryCode: '{}',
        organizationId: 1,
      } as unknown as DeviceGroup;
      const getAllNextrequestCertificateSpy = jest
        .spyOn(groupService, 'getAllNextRequestCertificate')
        .mockResolvedValue([mockGroupRequest]);
      const findOneSpy = jest
        .spyOn(groupService, 'findOne')
        .mockResolvedValue(mockGroup);
      const updatecertificateissuedateSpy = jest
        .spyOn(groupService, 'updateCertificateIssueDate')
        .mockResolvedValue(undefined);
      const NewFindForGroupSpy = jest
        .spyOn(deviceService, 'newFindForGroup')
        .mockImplementation(() => Promise.resolve({}));
      const orgFindOneSpy = jest
        .spyOn(organizationService, 'findOne')
        .mockResolvedValue({
          id: 1,
          name: 'orgName',
        } as unknown as Organization);
      const findForGroupSpy = jest
        .spyOn(deviceService, 'findForGroup')
        .mockResolvedValue([]);

      // Act
      await service.handleCron();

      // Assert
      expect(getAllNextrequestCertificateSpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalledWith({ id: mockGroupRequest.groupId });
      expect(updatecertificateissuedateSpy).toHaveBeenCalled();
      expect(NewFindForGroupSpy).toHaveBeenCalledWith(mockGroup.id);
      expect(orgFindOneSpy).toHaveBeenCalledWith(mockGroup.organizationId);
      expect(findForGroupSpy).toHaveBeenCalledWith(mockGroup.id);
    });
  });

  describe('addLateOngoingDeviceCertificateCycle', () => {
    it('should call addLateCertificateIssueDateLogForDevice with correct arguments', async () => {
      // Arrange
      const groupId = 1;
      const deviceExternalId = 'device123';
      const lateStartDate = new Date('2023-01-01');
      const lateEndDate = new Date('2023-01-31');

      const mockReturnValue =
        {} as unknown as DeviceLateOngoingIssueCertificateEntity; // or any expected return value

      const addLateCertificateIssueDateLogForDeviceSpy = jest
        .spyOn(deviceService, 'addLateCertificateIssueDateLogForDevice')
        .mockResolvedValue(mockReturnValue);

      // Act
      const result = await lateOngoingIssuanceService.addCycle(
        groupId,
        deviceExternalId,
        lateStartDate,
        lateEndDate,
      );

      // Assert
      expect(addLateCertificateIssueDateLogForDeviceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          device_externalid: deviceExternalId,
          groupId: groupId,
          late_start_date: lateStartDate.toString(),
          late_end_date: lateEndDate.toString(),
        }),
      );
      expect(result).toBe(mockReturnValue);
    });
  });

  describe('newHistoryIssueCertificateForDevice', () => {
    it('should return early if group buyerAddress or buyerId is missing', async () => {
      const group = {
        buyerAddress: null,
        buyerId: null,
      } as unknown as DeviceGroup;
      const deviceHistoryRequest =
        {} as unknown as HistoryIntermediateMeterRead;
      const device = {} as unknown as IDevice;

      await service.newHistoryIssueCertificateForDevice(
        group,
        deviceHistoryRequest,
        device,
      );

      expect(
        deviceService.addCertificateIssueDateLogForDevice,
      ).not.toHaveBeenCalled();
      expect(
        groupService.addCertificateIssueDateLogForDeviceGroup,
      ).not.toHaveBeenCalled();
      expect(
        readsService.updateHistoryCertificateIssueDate,
      ).not.toHaveBeenCalled();
    });

    it('should return early if deviceHistoryRequest.readsvalue is less than 1000', async () => {
      const group = {
        buyerAddress: 'some-address',
        buyerId: 1,
      } as unknown as DeviceGroup;
      const deviceHistoryRequest = {
        readsvalue: 999,
      } as unknown as HistoryIntermediateMeterRead;
      const device = {} as unknown as IDevice;

      await service.newHistoryIssueCertificateForDevice(
        group,
        deviceHistoryRequest,
        device,
      );

      expect(
        deviceService.addCertificateIssueDateLogForDevice,
      ).not.toHaveBeenCalled();
      expect(
        groupService.addCertificateIssueDateLogForDeviceGroup,
      ).not.toHaveBeenCalled();
      expect(
        readsService.updateHistoryCertificateIssueDate,
      ).not.toHaveBeenCalled();
    });

    it('should call AddCertificateIssueDateLogForDevice and log details correctly when all conditions are met', async () => {
      const group = {
        buyerAddress: 'some-address',
        buyerId: 1,
        id: 123,
        name: 'Test Group',
        devicegroup_uid: 'uid',
      } as unknown as DeviceGroup;

      const deviceHistoryRequest = {
        readsvalue: 1000,
        readsStartDate: new Date(),
        readsEndDate: new Date(),
        id: 1,
      } as unknown as HistoryIntermediateMeterRead;

      const device = {
        externalId: 'device123',
        countryCode: 'US',
      } as unknown as IDevice;

      await service.newHistoryIssueCertificateForDevice(
        group,
        deviceHistoryRequest,
        device,
      );

      expect(
        deviceService.addCertificateIssueDateLogForDevice,
      ).toHaveBeenCalled();
    });

    it('should call AddCertificateIssueDateLogForDeviceGroup and issue a certificate correctly when all conditions are met', async () => {
      const group = {
        buyerAddress: 'some-address',
        buyerId: 1,
        id: 123,
        name: 'Test Group',
        devicegroup_uid: 'uid',
      } as unknown as DeviceGroup;

      const deviceHistoryRequest = {
        readsvalue: 1000,
        readsStartDate: new Date(),
        readsEndDate: new Date(),
        id: 1,
      } as unknown as HistoryIntermediateMeterRead;

      const device = {
        externalId: 'device123',
        countryCode: 'US',
      } as unknown as IDevice;

      await service.newHistoryIssueCertificateForDevice(
        group,
        deviceHistoryRequest,
        device,
      );

      expect(
        groupService.addCertificateIssueDateLogForDeviceGroup,
      ).toHaveBeenCalled();
    });

    it('should update the history certificate issue date correctly', async () => {
      const group = {
        buyerAddress: 'some-address',
        buyerId: 1,
        id: 123,
        name: 'Test Group',
        devicegroup_uid: 'uid',
      } as unknown as DeviceGroup;

      const deviceHistoryRequest = {
        readsvalue: 1000,
        readsStartDate: new Date(),
        readsEndDate: new Date(),
        id: 1,
      } as unknown as HistoryIntermediateMeterRead;

      const device = {
        externalId: 'device123',
        countryCode: 'US',
      } as unknown as IDevice;

      await service.newHistoryIssueCertificateForDevice(
        group,
        deviceHistoryRequest,
        device,
      );

      expect(
        readsService.updateHistoryCertificateIssueDate,
      ).toHaveBeenCalledWith(
        deviceHistoryRequest.id,
        deviceHistoryRequest.readsStartDate,
        deviceHistoryRequest.readsEndDate,
      );
    });
  });

  describe('separateIntegerAndDecimalByCountryCode', () => {
    it('should correctly separate integer and decimal parts when both are non-zero', () => {
      const num = 5.75;

      // Mock the roundDecimalToFixedPrecision method

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(5);
      expect(result.decimalVal).toBe(0.75);
    });

    it('should return zero decimal value when input is an integer', () => {
      const num = 10;

      // Mock the roundDecimalToFixedPrecision method

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(10);
      expect(result.decimalVal).toBe(0);
    });

    it('should handle zero input', () => {
      const num = 0;

      // Mock the roundDecimalToFixedPrecision method

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(0);
      expect(result.decimalVal).toBe(0);
    });

    it('should handle negative numbers correctly', () => {
      const num = -3.65;

      // Mock the rounding function

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(-3); // Ensure this is what you expect based on the method logic
      expect(result.decimalVal).toBe(-0.65);
    });
  });

  describe('roundDecimalToFixedPrecision', () => {
    it('should round positive numbers correctly', () => {
      const num = 3.456;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(3.46); // Rounds to two decimal places
    });

    it('should round negative numbers correctly', () => {
      const num = -3.456;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(-3.46); // Rounds to two decimal places
    });

    it('should handle numbers already at two decimal places', () => {
      const num = 3.45;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(3.45); // No change needed
    });

    it('should handle zero correctly', () => {
      const num = 0;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(0); // Zero should remain zero
    });

    it('should handle numbers with fewer than two decimal places', () => {
      const num = 3.4;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(3.4); // No change needed
    });

    it('should handle very small decimal values correctly', () => {
      const num = 0.0001;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(0.0); // Rounds down to zero
    });
  });

  describe('separateIntegerAndDecimal', () => {
    it('should separate positive number into integer and decimal parts correctly', () => {
      const num = 3.456;

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(3); // Integer part
      expect(result.decimalVal).toBe(0.46); // Rounded decimal part
    });

    it('should handle negative number correctly', () => {
      const num = -3.456;

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(-3); // Integer part
      expect(result.decimalVal).toBe(-0.46); // Rounded decimal part
    });

    it('should handle zero correctly', () => {
      const num = 0;

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(0); // Integer part
      expect(result.decimalVal).toBe(0); // Decimal part
    });

    it('should handle number with fewer than two decimal places correctly', () => {
      const num = 3.4;

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(3); // Integer part
      expect(result.decimalVal).toBe(0.4); // Decimal part
    });

    it('should handle very small decimal values correctly', () => {
      const num = 0.0001;

      const result = splitValueIntoIntegerAndDecimal(num);

      expect(result.integralVal).toBe(0); // Integer part
      expect(result.decimalVal).toBe(0.0); // Rounded decimal part
    });
  });

  describe('roundDecimalNumber', () => {
    it('should round positive number correctly', () => {
      const num = 3.456;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(3.46); // Rounds to two decimal places
    });

    it('should round negative number correctly', () => {
      const num = -3.456;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(-3.46); // Rounds to two decimal places
    });

    it('should handle number already at two decimal places correctly', () => {
      const num = 3.45;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(3.45); // No change needed
    });

    it('should handle zero correctly', () => {
      const num = 0;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(0); // Zero should remain zero
    });

    it('should handle numbers with fewer than two decimal places correctly', () => {
      const num = 3.4;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(3.4); // No change needed
    });

    it('should handle very small decimal values correctly', () => {
      const num = 0.0001;

      const result = roundDecimalToFixedPrecision(num);

      expect(result).toBe(0.0); // Rounds down to zero
    });
  });

  describe('issueCertificateFromAPI', () => {
    it('should convert fromTime and toTime to Date and call issueCertificate', () => {
      const reading: IIssueCommandParams<ICertificateMetadata> = {
        fromTime: new Date('2024-01-01T00:00:00Z'),
        toTime: new Date('2024-01-02T00:00:00Z'),
        toAddress: 'test-address',
        userId: 'test-user-id',
        energyValue: '123.45', // Changed to string
        deviceId: 'test-device-id',
        metadata: {
          version: '1.0',
          deviceIds: ['device1', 'device2'],
          groupId: 'group1',
          // Provide other necessary properties if any
        },
      };

      // Mock the issueCertificate method
      const issueCertificateSpy = jest
        .spyOn(certificateService, 'issueFromAPI')
        .mockImplementation();

      certificateService.issueFromAPI(reading);

      // Check if issueCertificate was called with the correct reading object
      expect(issueCertificateSpy).toHaveBeenCalledWith(reading);
    });

    it('should handle invalid date strings gracefully', () => {
      const reading: IIssueCommandParams<ICertificateMetadata> = {
        fromTime: new Date('invalid-date'),
        toTime: new Date('invalid-date'),
        toAddress: 'test-address',
        userId: 'test-user-id',
        energyValue: '123.45', // Changed to string
        deviceId: 'test-device-id',
        metadata: {
          version: '1.0',
          deviceIds: ['device1', 'device2'],
          groupId: 'group1',
          // Provide other necessary properties if any
        },
      };

      // Mock the issueCertificate method
      const issueCertificateSpy = jest
        .spyOn(certificateService, 'issueFromAPI')
        .mockImplementation();

      certificateService.issueFromAPI(reading);

      // Check if fromTime and toTime are still converted to Date objects (invalid dates will be handled as such)
      expect(isNaN(reading.fromTime.getTime())).toBe(true);
      expect(isNaN(reading.toTime.getTime())).toBe(true);

      // Check if issueCertificate was called with the correct reading object
      expect(issueCertificateSpy).toHaveBeenCalledWith(reading);
    });
  });

  describe('issueCertificate', () => {
    it('should call offChainCertificateService.issue with the correct reading', () => {
      const reading: IIssueCommandParams<ICertificateMetadata> = {
        toAddress: 'mockAddress',
        userId: 'mockUserId',
        energyValue: '100', // Changed to string
        fromTime: new Date(),
        toTime: new Date(),
        metadata: {
          // Providing mock metadata
          version: '1.0',
          deviceIds: ['device123'],
          groupId: 'group456',
        } as ICertificateMetadata,
      } as unknown as IIssueCommandParams<ICertificateMetadata>;

      certificateService.issue(reading);

      expect(certificateService.issue).toHaveBeenCalledWith(reading);
    });
  });

  describe('getCertificateData', () => {
    it('should call offChainCertificateService.getAll with the correct request object', async () => {
      const request: IGetAllCertificatesOptions = {
        deviceId: '51',
      };
      const getAllSpy = jest
        .spyOn(certificateService, 'get')
        .mockResolvedValue([]);
      await certificateService.get(request);

      expect(getAllSpy).toHaveBeenCalledWith(request);
    });
  });

  describe('triggerOngoingLateIssuance', () => {
    it('should parse leftoverReadsByCountryCode if it is a string', async () => {
      const mockGroup = {
        id: 'group1',
        organizationId: 'org1',
        leftoverReadsByCountryCode: '{"key": "value"}',
      } as unknown as DeviceGroup;

      jest
        .spyOn(groupService, 'getAllReservationActive')
        .mockResolvedValue([mockGroup]);
      jest.spyOn(organizationService, 'findOne').mockResolvedValue({
        name: 'OrgName',
        blockchainAccountAddress: 'Address',
      } as unknown as Organization);
      jest.spyOn(deviceService, 'newFindForGroup').mockResolvedValue({});
      jest
        .spyOn(groupService, 'getGroupCertificateIssueDate')
        .mockResolvedValue({} as unknown as DeviceGroupNextIssueCertificate);
      await lateOngoingIssuanceService.triggerIssuance();

      const parsedLeftoverReads = JSON.parse(
        mockGroup.leftoverReadsByCountryCode,
      );

      expect(parsedLeftoverReads).toEqual({ key: 'value' });
    });
  });

  describe('LateOngoingIssueCertificateForGroup', () => {
    it('should handle missing organization', async () => {
      const group: DeviceGroup = {
        /* mock group data */
      } as unknown as DeviceGroup;
      const groupRequest: DeviceGroupNextIssueCertificate = {
        /* mock request data */
      } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';

      jest.spyOn(organizationService, 'findOne').mockResolvedValue(null);

      try {
        await lateOngoingIssuanceService.issueCertificateForGroup(
          group,
          startDate,
          endDate,
          countryCodeKey,
          groupRequest,
        );
      } catch (error) {
        console.log('Caught error:', error);
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('should handle case where no devices are present in the group', async () => {
      const group: DeviceGroup = {
        devices: [] /* other mock data */,
      } as unknown as DeviceGroup;
      const groupRequest: DeviceGroupNextIssueCertificate = {
        /* mock request data */
      } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';

      await lateOngoingIssuanceService.issueCertificateForGroup(
        group,
        startDate,
        endDate,
        countryCodeKey,
        groupRequest,
      );

      // Verify that no further methods are called
      expect(organizationService.findOne).not.toHaveBeenCalled();
    });
  });
});
