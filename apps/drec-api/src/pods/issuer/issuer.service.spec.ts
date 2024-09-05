/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from '../organization/organization.service';
import { IssuerService } from './issuer.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import { ReadsService } from '../reads/reads.service';
import { Device, DeviceService } from '../device';
import { HttpService } from '@nestjs/axios';
import { OffChainCertificateService } from '@energyweb/origin-247-certificate';
import { BASE_READ_SERVICE } from '../reads/const';
import { of } from 'rxjs';
import { Logger } from '@nestjs/common';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { DeviceGroup } from '../device-group/device-group.entity';
import { Organization } from '../organization/organization.entity';
import { DeviceCsvFileProcessingJobsEntity } from '../device-group/device_csv_processing_jobs.entity';
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { HistoryDeviceGroupNextIssueCertificate } from '../device-group/history_next_issuance_date_log.entity';
import { DeviceLateongoingIssueCertificateEntity } from '../device/device_lateongoing_certificate.entity';
import { NotFoundException } from '@nestjs/common'; // Adjust the import path as needed
import { DateTime } from 'luxon';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from '../device-group/check_certificate_issue_date_log_for_device_group.entity';
import { IDevice } from 'src/models';
import {
  FilterDTO,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';
import { ICertificateMetadata } from 'src/utils/types';
import {
  IGetAllCertificatesOptions,
  IIssueCommandParams,
} from '@energyweb/origin-247-certificate';

describe('IssuerService', () => {
  let service: IssuerService;
  let groupService: DeviceGroupService;
  let deviceService: DeviceService;
  let organizationService: OrganizationService;
  let readservice: ReadsService;
  let httpService: HttpService;
  let offChainCertificateService: OffChainCertificateService;
  let logger: Logger;
  let baseReadsService: BaseReadsService;

  beforeEach(async () => {
    jest.setTimeout(10000); // Set timeout to 10 seconds

    logger = { debug: jest.fn(), error: jest.fn() } as unknown as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuerService,
        {
          provide: DeviceGroupService,
          useValue: {
            getAllNextrequestCertificate: jest.fn(),
            findOne: jest.fn(),
            EndReservationGroup: jest.fn(),
            updatecertificateissuedate: jest.fn(),
            getNextHistoryissuanceDevicelog: jest.fn(),
            AddCertificateIssueDateLogForDeviceGroup: jest.fn(),
            HistoryUpdatecertificateissuedate: jest.fn(),
            updateTotalReadingRequestedForCertificateIssuance: jest.fn(),
            countgroupIdHistoryissuanceDevicelog: jest.fn(),
            getGroupiCertificateIssueDate: jest.fn(),
            deactiveReaservation: jest.fn(),
            updateLeftOverReadByCountryCode: jest.fn(),
            updateLeftOverRead: jest.fn(),
            getallReservationactive: jest.fn(),
            endReservation: jest.fn(),
            getNextrequestCertificateBYgroupId: jest.fn(),
          } as any,
        },
        {
          provide: DeviceService,
          useValue: {
            NewfindForGroup: jest.fn(),
            findForGroup: jest.fn(),
            findReads: jest.fn(),
            AddCertificateIssueDateLogForDevice: jest.fn(),
            removeFromGroup: jest.fn(),
            AddLateCertificateIssueDateLogForDevice: jest.fn(),
            finddeviceLateCycleOfdaterange: jest.fn(),
            getCheckCertificateIssueDateLogForDevice: jest.fn(),
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
            updatehistorycertificateissuedate: jest.fn(),
            getDeltaMeterReadsFirstEntryOfDevice: jest.fn(),
            latestread: jest.fn(),
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
          provide: OffChainCertificateService,
          useValue: {
            issue: jest.fn(),
            issueCertificate: jest.fn(),
            getAll: jest.fn(),
          } as any,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<IssuerService>(IssuerService);
    groupService = module.get<DeviceGroupService>(DeviceGroupService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<Logger>(Logger);
    deviceService = module.get<DeviceService>(DeviceService);
    organizationService = module.get<OrganizationService>(OrganizationService);
    readservice = module.get<ReadsService>(ReadsService);
    baseReadsService = module.get<BaseReadsService>(BASE_READ_SERVICE);
    offChainCertificateService = module.get<OffChainCertificateService>(OffChainCertificateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('hitTheCronFromIssuerAPIOngoing', () => {
    it('should log the verbose message and make an HTTP GET request', () => {
      // Act
      service.hitTheCronFromIssuerAPIOngoing();

      // Assert
      expect(httpService.get).toHaveBeenCalledWith(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/ongoing`);
    });
  });

  describe('hitTheCronFromIssuerAPIHistory', () => {
    it('should log the verbose message and make an HTTP GET request', () => {
      // Act
      service.hitTheCronFromIssuerAPIHistory();

      // Assert
      expect(httpService.get).toHaveBeenCalledWith(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/history`);
    });
  });

  describe('handleCron', () => {
    it('should update certificate issue date correctly', async () => {
      // Arrange
      const mockGroupRequest = { id: 1, groupId: 1, start_date: '2023-01-01', end_date: '2023-01-02', organizationId: 1, } as unknown as DeviceGroupNextIssueCertificate;
      const mockGroup = {
        id: 1,
        reservationEndDate: new Date('2023-01-03'),
        frequency: 'daily',
        leftoverReadsByCountryCode: '{}',
        organizationId: 1,
      } as unknown as DeviceGroup;
      const getAllNextrequestCertificateSpy = jest.spyOn(groupService, 'getAllNextrequestCertificate').mockResolvedValue([mockGroupRequest]);
      const findOneSpy = jest.spyOn(groupService, 'findOne').mockResolvedValue(mockGroup);
      const updatecertificateissuedateSpy = jest.spyOn(groupService, 'updatecertificateissuedate').mockResolvedValue(undefined);
      const NewfindForGroupSpy = jest.spyOn(deviceService, 'NewfindForGroup').mockImplementation(() => Promise.resolve({}));
      const orgfindOneSpy = jest.spyOn(organizationService, 'findOne').mockResolvedValue({id: 1, name: 'orgName'} as unknown as Organization);
      const findForGroupSpy = jest.spyOn(deviceService, 'findForGroup').mockResolvedValue([]);
  
      // Act
      await service.handleCron();
  
      // Assert
      expect(getAllNextrequestCertificateSpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalledWith({id: mockGroupRequest.groupId});
      expect(updatecertificateissuedateSpy).toHaveBeenCalled();
      expect(NewfindForGroupSpy).toHaveBeenCalledWith(mockGroup.id);
      expect(orgfindOneSpy).toHaveBeenCalledWith(mockGroup.organizationId);
      expect(findForGroupSpy).toHaveBeenCalledWith(mockGroup.id);
    });
  });
/*  
  describe('handleCronForHistoricalIssuance', () => {
    it('should call updateTotalReadingRequestedForCertificateIssuance with correct arguments', async () => {
      const mockGroup = {
        id: 1,
        organizationId: 2,
        buyerAddress: 'someAddress',
        buyerId: 'buyerId',
        reservationExpiryDate: new Date('2023-01-01T12:00:00Z'),
        reservationEndDate: new Date('2023-02-01T12:00:00Z'),
      } as unknown as DeviceGroup;
  
      const mockDevice = {
        id: 'device1',
        createdAt: new Date('2023-01-01'),
      } as unknown as Device;
  
      const mockRead = {
        readsvalue: 1000,
        readsStartDate: new Date('2023-01-01'),
        readsEndDate: new Date('2023-01-02'),
      } as unknown as HistoryIntermediate_MeterRead;
  
      jest.spyOn(groupService, 'getNextHistoryissuanceDevicelog').mockResolvedValue([
        {
          groupId: 1,
          id: 1,
          device_externalid: 'device1',
          reservationStartDate: new Date('2023-01-01'),
          reservationEndDate: new Date('2023-02-01'),
        } as unknown as HistoryDeviceGroupNextIssueCertificate,
      ]);
      jest.spyOn(groupService, 'findOne').mockResolvedValue(mockGroup);
      jest.spyOn(organizationService, 'findOne').mockResolvedValue({
        name: 'Org',
        blockchainAccountAddress: 'abc123',
      } as unknown as Organization);
      jest.spyOn(deviceService, 'findReads').mockResolvedValue(mockDevice);
      jest.spyOn(readservice, 'getCheckHistoryCertificateIssueDateLogForDevice').mockResolvedValue([mockRead]);
  
      const updateTotalReadingRequestedForCertificateIssuanceSpy = jest.spyOn(
        groupService,
        'updateTotalReadingRequestedForCertificateIssuance'
      ).mockResolvedValue(undefined);
  
      jest.spyOn(groupService, 'HistoryUpdatecertificateissuedate').mockResolvedValue(undefined);
      jest.spyOn(deviceService, 'removeFromGroup').mockResolvedValue(undefined);
      jest.spyOn(groupService, 'deactiveReaservation').mockResolvedValue(undefined);
      jest.spyOn(groupService, 'countgroupIdHistoryissuanceDevicelog').mockResolvedValue(0);
      jest.spyOn(groupService, 'getGroupiCertificateIssueDate').mockResolvedValue(undefined);
  
      await service.handleCronForHistoricalIssuance();
  
      // Add logging to check the arguments
      console.log('Arguments passed to updateTotalReadingRequestedForCertificateIssuance:', updateTotalReadingRequestedForCertificateIssuanceSpy.mock.calls);
  
      expect(updateTotalReadingRequestedForCertificateIssuanceSpy).toHaveBeenCalledWith(
        1,
        2,
        0.001
      );
    });
  });   */

  describe('addlateongoing_devicecertificatecycle', () => {
    it('should call AddLateCertificateIssueDateLogForDevice with correct arguments', async () => {
      // Arrange
      const groupId = 1;
      const device_externalid = 'device123';
      const late_start_date = new Date('2023-01-01');
      const late_end_date = new Date('2023-01-31');

      const mockReturnValue = {} as unknown as DeviceLateongoingIssueCertificateEntity; // or any expected return value

      const addLateCertificateIssueDateLogForDeviceSpy = jest
        .spyOn(deviceService, 'AddLateCertificateIssueDateLogForDevice')
        .mockResolvedValue(mockReturnValue);

      // Act
      const result = await service.addlateongoing_devicecertificatecycle(
        groupId,
        device_externalid,
        late_start_date,
        late_end_date
      );

      // Assert
      expect(addLateCertificateIssueDateLogForDeviceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          device_externalid: device_externalid,
          groupId: groupId,
          late_start_date: late_start_date.toString(),
          late_end_date: late_end_date.toString(),
        })
      );
      expect(result).toBe(mockReturnValue);
    });
  });
/*
  describe('newissueCertificateForGroup', () => {
    it('should log an error and throw NotFoundException if organization is not found', async () => {
      // Arrange
      const group: DeviceGroup = {
        organizationId: 1,
        devices: [],
        id: 1,
        name: 'Test Group',
        buyerAddress: 'address',
        buyerId: 1,
        devicegroup_uid: 'uid',
        authorityToExceed: false,
        targetVolumeCertificateGenerationRequestedInMegaWattHour: 10,
        targetVolumeInMegaWattHour: 100,
      } as unknown as DeviceGroup;
      const grouprequest: DeviceGroupNextIssueCertificate = {
        id: 1,
        groupId: 1,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';
    
      const findOneSpy = jest.spyOn(organizationService, 'findOne').mockResolvedValue(null);
    
      // Act & Assert
      await expect(
        service.newissueCertificateForGroup(
          group,
          grouprequest,
          startDate,
          endDate,
          countryCodeKey
        )
      ).rejects.toThrow(NotFoundException);
    
      expect(findOneSpy).toHaveBeenCalledWith(0);
    });    
  
    it('should not proceed if group has no devices', async () => {
      // Arrange
      const group: DeviceGroup = {
        organizationId: 1,
        devices: [],
        id: 1,
        name: 'Test Group',
        buyerAddress: 'address',
        buyerId: 1,
        devicegroup_uid: 'uid',
        authorityToExceed: false,
        targetVolumeCertificateGenerationRequestedInMegaWattHour: 10,
        targetVolumeInMegaWattHour: 100,
      } as unknown as DeviceGroup;
      const grouprequest: DeviceGroupNextIssueCertificate = {
        id: 1,
        groupId: 1,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';
  
      const findOneSpy = jest.spyOn(organizationService, 'findOne').mockResolvedValue({} as unknown as Organization);
  
      // Act
      await service.newissueCertificateForGroup(
        group,
        grouprequest,
        startDate,
        endDate,
        countryCodeKey
      );
  
      // Assert
      expect(findOneSpy).toHaveBeenCalledWith(group.organizationId);
    });
  
    it('should handle devices and calculate reads correctly', async () => {
      // Arrange
      const group: DeviceGroup = {
        organizationId: 1,
        devices: [
          {
            externalId: 'device123',
            meterReadtype: 'Delta',
            createdAt: new Date(),
          } as IDevice,
        ],
        id: 1,
        name: 'Test Group',
        buyerAddress: 'address',
        buyerId: 1,
        devicegroup_uid: 'uid',
        authorityToExceed: false,
        targetVolumeCertificateGenerationRequestedInMegaWattHour: 10,
        targetVolumeInMegaWattHour: 100,
      } as unknown as DeviceGroup;
      const grouprequest: DeviceGroupNextIssueCertificate = {
        id: 1,
        groupId: 1,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
      } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';
  
      const findOneSpy = jest.spyOn(organizationService, 'findOne').mockResolvedValue({} as unknown as Organization);
      jest.spyOn(deviceService, 'finddeviceLateCycleOfdaterange').mockResolvedValue([] as unknown as boolean);
      const getCheckCertificateIssueDateLogForDeviceSpy = jest.spyOn(deviceService, 'getCheckCertificateIssueDateLogForDevice').mockResolvedValue([]);
      jest.spyOn(readservice, 'getDeltaMeterReadsFirstEntryOfDevice').mockResolvedValue([]);
      jest.spyOn(readservice, 'latestread').mockResolvedValue([{ timestamp: new Date() }]);
      jest.spyOn(readservice, 'findLastReadForMeterWithinRange').mockResolvedValue([]);
      jest.spyOn(readservice, 'getAggregateMeterReadsFirstEntryOfDevice').mockResolvedValue([]);
      const AddCertificateIssueDateLogForDeviceGroupSpy = jest.spyOn(groupService, 'AddCertificateIssueDateLogForDeviceGroup').mockResolvedValue({} as unknown as CheckCertificateIssueDateLogForDeviceGroupEntity);
  
      // Act
      await service.newissueCertificateForGroup(
        group,
        grouprequest,
        startDate,
        endDate,
        countryCodeKey
      );
  
      // Assert
      expect(findOneSpy).toHaveBeenCalledWith(group.organizationId);
      expect(getCheckCertificateIssueDateLogForDeviceSpy).toHaveBeenCalled();
      expect(AddCertificateIssueDateLogForDeviceGroupSpy).toHaveBeenCalled();
    });
  });  */

  describe('newHistoryissueCertificateForDevice', () => {
    it('should return early if group buyerAddress or buyerId is missing', async () => {
      const group = { buyerAddress: null, buyerId: null } as unknown as DeviceGroup;
      const devicehistoryrequest = {} as unknown as HistoryIntermediate_MeterRead;
      const device = {} as unknown as IDevice;
    
      await service.newHistoryissueCertificateForDevice(group, devicehistoryrequest, device);
    
      expect(deviceService.AddCertificateIssueDateLogForDevice).not.toHaveBeenCalled();
      expect(groupService.AddCertificateIssueDateLogForDeviceGroup).not.toHaveBeenCalled();
      expect(readservice.updatehistorycertificateissuedate).not.toHaveBeenCalled();
    });
    
    it('should return early if devicehistoryrequest.readsvalue is less than 1000', async () => {
      const group = { buyerAddress: 'some-address', buyerId: 1 } as unknown as DeviceGroup;
      const devicehistoryrequest = { readsvalue: 999 } as unknown as HistoryIntermediate_MeterRead;
      const device = {} as unknown as IDevice;
    
      await service.newHistoryissueCertificateForDevice(group, devicehistoryrequest, device);
    
      expect(deviceService.AddCertificateIssueDateLogForDevice).not.toHaveBeenCalled();
      expect(groupService.AddCertificateIssueDateLogForDeviceGroup).not.toHaveBeenCalled();
      expect(readservice.updatehistorycertificateissuedate).not.toHaveBeenCalled();
    });
    
    it('should call AddCertificateIssueDateLogForDevice and log details correctly when all conditions are met', async () => {
      const group = {
        buyerAddress: 'some-address',
        buyerId: 1,
        id: 123,
        name: 'Test Group',
        devicegroup_uid: 'uid'
      } as unknown as DeviceGroup;
    
      const devicehistoryrequest = {
        readsvalue: 1000,
        readsStartDate: new Date(),
        readsEndDate: new Date(),
        id: 1
      } as unknown as HistoryIntermediate_MeterRead;
    
      const device = {
        externalId: 'device123',
        countryCode: 'US'
      } as unknown as IDevice;
    
      await service.newHistoryissueCertificateForDevice(group, devicehistoryrequest, device);
    
      expect(deviceService.AddCertificateIssueDateLogForDevice).toHaveBeenCalled();
    });
    
    it('should call AddCertificateIssueDateLogForDeviceGroup and issue a certificate correctly when all conditions are met', async () => {
      const group = {
        buyerAddress: 'some-address',
        buyerId: 1,
        id: 123,
        name: 'Test Group',
        devicegroup_uid: 'uid'
      } as unknown as DeviceGroup;
    
      const devicehistoryrequest = {
        readsvalue: 1000,
        readsStartDate: new Date(),
        readsEndDate: new Date(),
        id: 1
      } as unknown as HistoryIntermediate_MeterRead;
    
      const device = {
        externalId: 'device123',
        countryCode: 'US'
      } as unknown as IDevice;
    
      await service.newHistoryissueCertificateForDevice(group, devicehistoryrequest, device);
    
      expect(groupService.AddCertificateIssueDateLogForDeviceGroup).toHaveBeenCalled();
    });
    
    it('should update the history certificate issue date correctly', async () => {
      const group = {
        buyerAddress: 'some-address',
        buyerId: 1,
        id: 123,
        name: 'Test Group',
        devicegroup_uid: 'uid'
      } as unknown as DeviceGroup;
    
      const devicehistoryrequest = {
        readsvalue: 1000,
        readsStartDate: new Date(),
        readsEndDate: new Date(),
        id: 1
      } as unknown as HistoryIntermediate_MeterRead;
    
      const device = {
        externalId: 'device123',
        countryCode: 'US'
      } as unknown as IDevice;
    
      await service.newHistoryissueCertificateForDevice(group, devicehistoryrequest, device);
    
      expect(readservice.updatehistorycertificateissuedate).toHaveBeenCalledWith(
        devicehistoryrequest.id,
        devicehistoryrequest.readsStartDate,
        devicehistoryrequest.readsEndDate
      );
    });    
  });

  describe('handleLeftoverReadsByCountryCode', () => {
    it('should correctly handle leftover reads when there are no existing leftovers', async () => {
      const group = {
        id: 1,
        leftoverReadsByCountryCode: {},
      } as unknown as DeviceGroup;
      const totalReadValueW = 5000; // 5 kW
      const countryCodeKey = 'US';
    
      // Mock the separateIntegerAndDecimalByCountryCode method
      jest.spyOn(service, 'separateIntegerAndDecimalByCountryCode').mockReturnValue({
        integralVal: 5,
        decimalVal: 0,
      });
    
      const result = await service.handleLeftoverReadsByCountryCode(group, totalReadValueW, countryCodeKey);
    
      expect(service.separateIntegerAndDecimalByCountryCode).toHaveBeenCalledWith(5); // 5 kW
      expect(groupService.updateLeftOverReadByCountryCode).toHaveBeenCalledWith(1, 0, 'US');
      expect(result).toBe(5);
    });
    
    it('should correctly handle leftover reads when there are existing leftovers', async () => {
      const group = {
        id: 1,
        leftoverReadsByCountryCode: {
          US: 0.5,
        },
      } as unknown as DeviceGroup;
      const totalReadValueW = 5000; // 5 kW
      const countryCodeKey = 'US';
    
      // Mock the separateIntegerAndDecimalByCountryCode method
      jest.spyOn(service, 'separateIntegerAndDecimalByCountryCode').mockReturnValue({
        integralVal: 5,
        decimalVal: 0.5,
      });
    
      const result = await service.handleLeftoverReadsByCountryCode(group, totalReadValueW, countryCodeKey);
    
      expect(service.separateIntegerAndDecimalByCountryCode).toHaveBeenCalledWith(5.5); // 5.5 kW
      expect(groupService.updateLeftOverReadByCountryCode).toHaveBeenCalledWith(1, 0.5, 'US');
      expect(result).toBe(5);
    });
    
    it('should correctly handle leftover reads when resulting value has decimal part', async () => {
      const group = {
        id: 1,
        leftoverReadsByCountryCode: {},
      } as unknown as DeviceGroup;
      const totalReadValueW = 5500; // 5.5 kW
      const countryCodeKey = 'US';
    
      // Mock the separateIntegerAndDecimalByCountryCode method
      jest.spyOn(service, 'separateIntegerAndDecimalByCountryCode').mockReturnValue({
        integralVal: 5,
        decimalVal: 0.5,
      });
    
      const result = await service.handleLeftoverReadsByCountryCode(group, totalReadValueW, countryCodeKey);
    
      expect(service.separateIntegerAndDecimalByCountryCode).toHaveBeenCalledWith(5.5); // 5.5 kW
      expect(groupService.updateLeftOverReadByCountryCode).toHaveBeenCalledWith(1, 0.5, 'US');
      expect(result).toBe(5);
    });    
  });

  describe('separateIntegerAndDecimalByCountryCode', () => {
    it('should correctly separate integer and decimal parts when both are non-zero', () => {
      const num = 5.75;
      
      // Mock the roundDecimalNumberByCountryCode method
      jest.spyOn(service, 'roundDecimalNumberByCountryCode').mockReturnValue(0.75);
    
      const result = service.separateIntegerAndDecimalByCountryCode(num);
    
      expect(result.integralVal).toBe(5);
      expect(result.decimalVal).toBe(0.75);
    });
    
    it('should return zero decimal value when input is an integer', () => {
      const num = 10;
    
      // Mock the roundDecimalNumberByCountryCode method
      jest.spyOn(service, 'roundDecimalNumberByCountryCode').mockReturnValue(0);
    
      const result = service.separateIntegerAndDecimalByCountryCode(num);
    
      expect(result.integralVal).toBe(10);
      expect(result.decimalVal).toBe(0);
    });
    
    it('should handle zero input', () => {
      const num = 0;
    
      // Mock the roundDecimalNumberByCountryCode method
      jest.spyOn(service, 'roundDecimalNumberByCountryCode').mockReturnValue(0);
    
      const result = service.separateIntegerAndDecimalByCountryCode(num);
    
      expect(result.integralVal).toBe(0);
      expect(result.decimalVal).toBe(0);
    });
    
    it('should handle negative numbers correctly', () => {
      const num = -3.65;
    
      // Mock the rounding function
      jest.spyOn(service, 'roundDecimalNumberByCountryCode').mockReturnValue(-0.65);
    
      const result = service.separateIntegerAndDecimalByCountryCode(num);
    
      expect(result.integralVal).toBe(-4); // Ensure this is what you expect based on the method logic
      expect(result.decimalVal).toBe(-0.65);
    });    
  });

  describe('roundDecimalNumberByCountryCode', () => {
    it('should round positive numbers correctly', () => {
      const num = 3.456;
    
      const result = service.roundDecimalNumberByCountryCode(num);
    
      expect(result).toBe(3.46); // Rounds to two decimal places
    });
    
    it('should round negative numbers correctly', () => {
      const num = -3.456;
    
      const result = service.roundDecimalNumberByCountryCode(num);
    
      expect(result).toBe(-3.46); // Rounds to two decimal places
    });
    
    it('should handle numbers already at two decimal places', () => {
      const num = 3.45;
    
      const result = service.roundDecimalNumberByCountryCode(num);
    
      expect(result).toBe(3.45); // No change needed
    });
    
    it('should handle zero correctly', () => {
      const num = 0;
    
      const result = service.roundDecimalNumberByCountryCode(num);
    
      expect(result).toBe(0); // Zero should remain zero
    });
    
    it('should handle numbers with fewer than two decimal places', () => {
      const num = 3.4;
    
      const result = service.roundDecimalNumberByCountryCode(num);
    
      expect(result).toBe(3.4); // No change needed
    });
    
    it('should handle very small decimal values correctly', () => {
      const num = 0.0001;
    
      const result = service.roundDecimalNumberByCountryCode(num);
    
      expect(result).toBe(0.00); // Rounds down to zero
    });    
  });

  describe('handleLeftoverReads', () => {
    it('should handle leftover reads correctly and return the integral value', async () => {
      const group = {
        id: 1,
        leftoverReads: 0.2
      } as DeviceGroup;
      const totalReadValueW = 5000;
    
      // Mock the `separateIntegerAndDecimal` method
      jest.spyOn(service, 'separateIntegerAndDecimal').mockReturnValue({ integralVal: 5, decimalVal: 0.2 });
    
      // Mock the `updateLeftOverRead` method
      const updateLeftOverReadSpy = jest.spyOn(groupService, 'updateLeftOverRead').mockResolvedValue(undefined);
    
      const result = await service.handleLeftoverReads(group, totalReadValueW);
    
      expect(result).toBe(5); // Integral value returned
      expect(updateLeftOverReadSpy).toHaveBeenCalledWith(group.id, 0.2); // Check if updateLeftOverRead was called with correct values
    });
    
    it('should handle case with no leftover reads and return the integral value', async () => {
      const group = {
        id: 2,
        leftoverReads: 0
      } as DeviceGroup;
      const totalReadValueW = 8000;
    
      // Mock the `separateIntegerAndDecimal` method
      jest.spyOn(service, 'separateIntegerAndDecimal').mockReturnValue({ integralVal: 8, decimalVal: 0 });
    
      // Mock the `updateLeftOverRead` method
      const updateLeftOverReadSpy = jest.spyOn(groupService, 'updateLeftOverRead').mockResolvedValue(undefined);
    
      const result = await service.handleLeftoverReads(group, totalReadValueW);
    
      expect(result).toBe(8); // Integral value returned
      expect(updateLeftOverReadSpy).toHaveBeenCalledWith(group.id, 0); // Check if updateLeftOverRead was called with correct values
    });
    
    it('should handle case with leftover reads that leads to rounding', async () => {
      const group = {
        id: 3,
        leftoverReads: 0.75
      } as DeviceGroup;
      const totalReadValueW = 3500;
    
      // Mock the `separateIntegerAndDecimal` method
      jest.spyOn(service, 'separateIntegerAndDecimal').mockReturnValue({ integralVal: 4, decimalVal: 0.25 });
    
      // Mock the `updateLeftOverRead` method
      const updateLeftOverReadSpy = jest.spyOn(groupService, 'updateLeftOverRead').mockResolvedValue(undefined);
    
      const result = await service.handleLeftoverReads(group, totalReadValueW);
    
      expect(result).toBe(4); // Integral value returned
      expect(updateLeftOverReadSpy).toHaveBeenCalledWith(group.id, 0.25); // Check if updateLeftOverRead was called with correct values
    });
    
    it('should handle case with zero totalReadValueW', async () => {
      const group = {
        id: 4,
        leftoverReads: 0.5
      } as DeviceGroup;
      const totalReadValueW = 0;
    
      // Mock the `separateIntegerAndDecimal` method
      jest.spyOn(service, 'separateIntegerAndDecimal').mockReturnValue({ integralVal: 0, decimalVal: 0.5 });
    
      // Mock the `updateLeftOverRead` method
      const updateLeftOverReadSpy = jest.spyOn(groupService, 'updateLeftOverRead').mockResolvedValue(undefined);
    
      const result = await service.handleLeftoverReads(group, totalReadValueW);
    
      expect(result).toBe(0); // Integral value returned
      expect(updateLeftOverReadSpy).toHaveBeenCalledWith(group.id, 0.5); // Check if updateLeftOverRead was called with correct values
    });    
  });
  
  describe('separateIntegerAndDecimal', () => {
    it('should separate positive number into integer and decimal parts correctly', () => {
      const num = 3.456;
    
      // Mock the `roundDecimalNumber` method
      jest.spyOn(service, 'roundDecimalNumber').mockReturnValue(0.46);
    
      const result = service.separateIntegerAndDecimal(num);
    
      expect(result.integralVal).toBe(3); // Integer part
      expect(result.decimalVal).toBe(0.46); // Rounded decimal part
    });
    
    it('should handle negative number correctly', () => {
      const num = -3.456;
    
      // Mock the `roundDecimalNumber` method
      jest.spyOn(service, 'roundDecimalNumber').mockReturnValue(-0.46);
    
      const result = service.separateIntegerAndDecimal(num);
    
      expect(result.integralVal).toBe(-4); // Integer part
      expect(result.decimalVal).toBe(-0.46); // Rounded decimal part
    });
    
    it('should handle zero correctly', () => {
      const num = 0;
    
      // Mock the `roundDecimalNumber` method
      jest.spyOn(service, 'roundDecimalNumber').mockReturnValue(0);
    
      const result = service.separateIntegerAndDecimal(num);
    
      expect(result.integralVal).toBe(0); // Integer part
      expect(result.decimalVal).toBe(0); // Decimal part
    });
    
    it('should handle number with fewer than two decimal places correctly', () => {
      const num = 3.4;
    
      // Mock the `roundDecimalNumber` method
      jest.spyOn(service, 'roundDecimalNumber').mockReturnValue(0.4);
    
      const result = service.separateIntegerAndDecimal(num);
    
      expect(result.integralVal).toBe(3); // Integer part
      expect(result.decimalVal).toBe(0.4); // Decimal part
    });
    
    it('should handle very small decimal values correctly', () => {
      const num = 0.0001;
    
      // Mock the `roundDecimalNumber` method
      jest.spyOn(service, 'roundDecimalNumber').mockReturnValue(0.00);
    
      const result = service.separateIntegerAndDecimal(num);
    
      expect(result.integralVal).toBe(0); // Integer part
      expect(result.decimalVal).toBe(0.00); // Rounded decimal part
    });    
  });

  describe('roundDecimalNumber', () => {
    it('should round positive number correctly', () => {
      const num = 3.456;
    
      const result = service.roundDecimalNumber(num);
    
      expect(result).toBe(3.46); // Rounds to two decimal places
    });
    
    it('should round negative number correctly', () => {
      const num = -3.456;
    
      const result = service.roundDecimalNumber(num);
    
      expect(result).toBe(-3.46); // Rounds to two decimal places
    });
    
    it('should handle number already at two decimal places correctly', () => {
      const num = 3.45;
    
      const result = service.roundDecimalNumber(num);
    
      expect(result).toBe(3.45); // No change needed
    });
    
    it('should handle zero correctly', () => {
      const num = 0;
    
      const result = service.roundDecimalNumber(num);
    
      expect(result).toBe(0); // Zero should remain zero
    });
    
    it('should handle numbers with fewer than two decimal places correctly', () => {
      const num = 3.4;
    
      const result = service.roundDecimalNumber(num);
    
      expect(result).toBe(3.4); // No change needed
    });
    
    it('should handle very small decimal values correctly', () => {
      const num = 0.0001;
    
      const result = service.roundDecimalNumber(num);
    
      expect(result).toBe(0.00); // Rounds down to zero
    });    
  });

  describe('getDeviceFullReadsWithTimestampAndValueAsArray', () => {
    it('should return device reads when find is successful', async () => {
      const meterId = 'test-meter-id';
      const filter: FilterDTO = {} as unknown as FilterDTO; // Adjust as needed
      const mockReads = [
        { timestamp: new Date('2024-01-01T00:00:00Z'), value: 123.45 },
        { timestamp: new Date('2024-01-02T00:00:00Z'), value: 678.90 },
      ];
    
      jest.spyOn(baseReadsService, 'find').mockResolvedValue(mockReads);
    
      const result = await service.getDeviceFullReadsWithTimestampAndValueAsArray(meterId, filter);
    
      expect(result).toEqual(mockReads);
    });
    
    it('should handle errors thrown by baseReadsService.find', async () => {
      const meterId = 'test-meter-id';
      const filter: FilterDTO = {} as unknown as FilterDTO; // Adjust as needed
    
      jest.spyOn(baseReadsService, 'find').mockRejectedValue(new Error('Test error'));
    
      const result = await service.getDeviceFullReadsWithTimestampAndValueAsArray(meterId, filter);
    
      expect(result).toBeUndefined(); // Expectation depends on how you handle errors in your service
    });
    
    it('should log errors when baseReadsService.find throws an exception', async () => {
      const meterId = 'test-meter-id';
      const filter: FilterDTO = {} as unknown as FilterDTO; // Adjust as needed
      const error = new Error('Test error');
    
      jest.spyOn(baseReadsService, 'find').mockRejectedValue(error);
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();
    
      await service.getDeviceFullReadsWithTimestampAndValueAsArray(meterId, filter);
    
      expect(loggerErrorSpy).toHaveBeenCalledWith('exception caught in inbetween device onboarding checking for createdAt');
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
    });    
  });

  describe('issueCertificateFromAPI', () => {
    it('should convert fromTime and toTime to Date and call issueCertificate', () => {
      const reading: IIssueCommandParams<ICertificateMetadata> = {
        fromTime: new Date('2024-01-01T00:00:00Z'),
        toTime: new Date('2024-01-02T00:00:00Z'),
        toAddress: 'test-address',
        userId: 'test-user-id',
        energyValue: '123.45',  // Changed to string
        deviceId: 'test-device-id',
        metadata: {
          version: '1.0',
          deviceIds: ['device1', 'device2'],
          groupId: 'group1',
          // Provide other necessary properties if any
        },
      };
  
      // Mock the issueCertificate method
      const issueCertificateSpy = jest.spyOn(service, 'issueCertificate').mockImplementation();
  
      service.issueCertificateFromAPI(reading);
  
      // Check if issueCertificate was called with the correct reading object
      expect(issueCertificateSpy).toHaveBeenCalledWith(reading);
    });
  
    it('should handle invalid date strings gracefully', () => {
      const reading: IIssueCommandParams<ICertificateMetadata> = {
        fromTime: new Date('invalid-date'),
        toTime: new Date('invalid-date'),
        toAddress: 'test-address',
        userId: 'test-user-id',
        energyValue: '123.45',  // Changed to string
        deviceId: 'test-device-id',
        metadata: {
          version: '1.0',
          deviceIds: ['device1', 'device2'],
          groupId: 'group1',
          // Provide other necessary properties if any
        },
      };
  
      // Mock the issueCertificate method
      const issueCertificateSpy = jest.spyOn(service, 'issueCertificate').mockImplementation();
  
      service.issueCertificateFromAPI(reading);
  
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
        energyValue: '100',  // Changed to string
        fromTime: new Date(),
        toTime: new Date(),
        metadata: {          // Providing mock metadata
          version: '1.0',
          deviceIds: ['device123'],
          groupId: 'group456',
        } as ICertificateMetadata,
      } as unknown as IIssueCommandParams<ICertificateMetadata>;
  
      service.issueCertificate(reading);
  
      expect(offChainCertificateService.issue).toHaveBeenCalledWith(reading);
    });
  });

  describe('getCertificateData', () => {
    it('should call offChainCertificateService.getAll with the correct request object', async () => {
      const request: IGetAllCertificatesOptions = {
        deviceId: '51',
      };
      const getAllSpy = jest.spyOn(offChainCertificateService, 'getAll').mockResolvedValue([]);
      await service.getCertificateData();
  
      expect(getAllSpy).toHaveBeenCalledWith(request);
    });
  });

  describe('handleCronForOngoingLateIssuance', () => {
    it('should parse leftoverReadsByCountryCode if it is a string', async () => {
      const mockGroup = {
        id: 'group1',
        organizationId: 'org1',
        leftoverReadsByCountryCode: '{"key": "value"}',
      } as unknown as DeviceGroup;
  
      jest.spyOn(groupService,'getallReservationactive').mockResolvedValue([mockGroup]);
      jest.spyOn(organizationService,'findOne').mockResolvedValue({ name: 'OrgName', blockchainAccountAddress: 'Address' } as unknown as Organization);
      jest.spyOn(deviceService,'NewfindForGroup').mockResolvedValue({});
      jest.spyOn(groupService,'getGroupiCertificateIssueDate').mockResolvedValue({} as unknown as DeviceGroupNextIssueCertificate);
  
      await service.handleCronForOngoingLateIssuance();
  
      expect(mockGroup.leftoverReadsByCountryCode).toEqual({ key: 'value' });
    });
  });

  describe('LateOngoingissueCertificateForGroup', () => {
    it('should handle missing organization', async () => {
      const group: DeviceGroup = { /* mock group data */ } as unknown as DeviceGroup;
      const grouprequest: DeviceGroupNextIssueCertificate = { /* mock request data */ } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';
  
      jest.spyOn(organizationService, 'findOne').mockResolvedValue(null);
  
      try {
        await service.LateOngoingissueCertificateForGroup(
          group,
          grouprequest,
          startDate,
          endDate,
          countryCodeKey
        );
      } catch (error) {
        console.log('Caught error:', error);
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  
    it('should handle case where no devices are present in the group', async () => {
      const group: DeviceGroup = { devices: [], /* other mock data */ } as unknown as DeviceGroup;
      const grouprequest: DeviceGroupNextIssueCertificate = { /* mock request data */ } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';
  
      await service.LateOngoingissueCertificateForGroup(group, grouprequest, startDate, endDate, countryCodeKey);
  
      // Verify that no further methods are called
      expect(organizationService.findOne).not.toHaveBeenCalled();
    });
  /*
    it('should handle successful certificate issuance', async () => {
      const group: DeviceGroup = {
        devices: [
          {
            externalId: 'device123',
            meterReadtype: 'Delta',
            createdAt: new Date(),
          },
        ],
        organizationId: 'org123',
        buyerAddress: 'buyer@example.com',
        buyerId: 'buyerId123',
        id: 'group123',
        devicegroup_uid: 'devicegroup123',
        authorityToExceed: false,
        targetVolumeCertificateGenerationRequestedInMegaWattHour: 0,
        targetVolumeInMegaWattHour: 100,
      } as unknown as DeviceGroup;
      
      const grouprequest: DeviceGroupNextIssueCertificate = { } as unknown as DeviceGroupNextIssueCertificate;
      const startDate = DateTime.now();
      const endDate = DateTime.now();
      const countryCodeKey = 'US';
    
      jest.spyOn(organizationService, 'findOne').mockResolvedValue({
        id: 'org123',
        // Mock other necessary properties
      } as unknown as Organization);
      
      jest.spyOn(readservice, 'getDeltaMeterReadsFirstEntryOfDevice').mockResolvedValue([]);
      jest.spyOn(readservice, 'findLastReadForMeterWithinRange').mockResolvedValue([]);
      jest.spyOn(readservice, 'getAggregateMeterReadsFirstEntryOfDevice').mockResolvedValue([]);
      
      jest.spyOn(deviceService, 'getCheckCertificateIssueDateLogForDevice').mockResolvedValue([]);
      jest.spyOn(deviceService, 'AddCertificateIssueDateLogForDevice').mockImplementation(() => undefined);
      jest.spyOn(groupService, 'updateTotalReadingRequestedForCertificateIssuance').mockImplementation(() => undefined);
      jest.spyOn(groupService, 'endReservation').mockImplementation(() => undefined);
      jest.spyOn(groupService, 'AddCertificateIssueDateLogForDeviceGroup').mockImplementation(() => undefined);
      jest.spyOn(service, 'issueCertificate').mockImplementation(() => undefined);
    
      await service.LateOngoingissueCertificateForGroup(group, grouprequest, startDate, endDate, countryCodeKey);
    
      // Add assertions to verify expected behavior
      expect(deviceService.AddCertificateIssueDateLogForDevice).toHaveBeenCalled();
      expect(groupService.AddCertificateIssueDateLogForDeviceGroup).toHaveBeenCalled();
      expect(service.issueCertificate).toHaveBeenCalled();
    });*/  
  });
/*
  describe('getmissingcyclebeforelateongoing', () => {
    it('should add late ongoing device certificate cycle', async () => {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      groupService.getallReservationactive = jest.fn().mockResolvedValue([{ id: 'group1', frequency: 'daily' }]);
      deviceService.findForGroup = jest.fn().mockResolvedValue([{ externalId: 'device1', createdAt: startDate }]);
      deviceService.findoneLateCycle = jest.fn().mockResolvedValue([{ late_start_date: startDate.toISOString() }]);
      deviceService.finddeviceLateCycleOfdaterange = jest.fn().mockResolvedValue(null);
      service.addlateongoing_devicecertificatecycle = jest.fn().mockResolvedValue(undefined);
      
      await service.getmissingcyclebeforelateongoing();
      
      // Verify that addlateongoing_devicecertificatecycle was called
      expect(service.addlateongoing_devicecertificatecycle).toHaveBeenCalledWith(
        'group1',
        'device1',
        startDate.toISOString(),
        endDate.toISOString()
      );
    });
  });*/
});
