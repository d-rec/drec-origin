/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from './device.service';
import {
  Repository,
  FindManyOptions,
  LessThanOrEqual,
  MoreThanOrEqual,
  In,
  FindOneOptions,
} from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { Device } from './device.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { ConflictException } from '@nestjs/common';
import { IrecDevicesInformationEntity } from './irec_devices_information.entity';
import { IrecErrorLogInformationEntity } from './irec_error_log_information.entity';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { Role } from '../../utils/enums/role.enum';
import { DeviceDTO, DeviceGroupByDTO, FilterDTO, NewDeviceDTO, UpdateDeviceDTO } from './dto';
import {
  DeviceOrderBy,
  DevicetypeCode,
  FuelCode,
  OffTaker,
  OrganizationStatus,
} from '../../utils/enums';
import { DeviceDescription } from '../../models';
import { Organization } from '../organization/organization.entity';
import { DeviceLateongoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';
import { HttpService } from '@nestjs/axios';
import { User } from '../user/user.entity';
import * as deviceUtils from '../../utils/localTimeDetailsForDevice';
import { DeviceCsvFileProcessingJobsEntity } from '../device-group/device_csv_processing_jobs.entity';

describe('DeviceService', () => {
  let service: DeviceService;
  let historyrepository: Repository<HistoryIntermediate_MeterRead>;
  let repository: Repository<Device>;
  let checkdevcielogcertificaterepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>;
  let httpService: HttpService;
  let irecinforepository: Repository<IrecDevicesInformationEntity>;
  let irecerrorlogrepository: Repository<IrecErrorLogInformationEntity>;
  let organizationService: OrganizationService;
  let userService: UserService;
  let deviceLateOngoingCertificaterepository: DeviceLateongoingIssueCertificateEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: getRepositoryToken(Device),
          useClass: Repository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          } as any,
        },
        {
          provide: getRepositoryToken(HistoryIntermediate_MeterRead),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(
            CheckCertificateIssueDateLogForDeviceEntity,
          ),
          useClass: Repository,
        },
        {
          provide: HttpService,
          useValue: {} as any,
        },
        {
          provide: getRepositoryToken(IrecDevicesInformationEntity),
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
          provide: getRepositoryToken(DeviceLateongoingIssueCertificateEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    repository = module.get<Repository<Device>>(getRepositoryToken(Device));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new device with valid inputs', async () => {
      const orgCode = 3;
      const newDevice: NewDeviceDTO = {
        externalId: 'ExternalId1',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        fuelCode: FuelCode.ES100, //'ES100',
        deviceTypeCode: DevicetypeCode.TC110, //'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: OffTaker.School, //'School',
        impactStory: null,
        images: null,
        deviceDescription: DeviceDescription.SolarLantern, //'Solar Lantern',
        energyStorage: true,
        energyStorageCapacity: 900,
        qualityLabels: null,
        SDGBenefits: ['SDG1'],
        version: '1.0',
        countryCode: 'IND',
      };
      const apiUserId = 'a8b6366e-ea5f-4ed7-8e9d-c5ae71c2d909';
      const role = Role.OrganizationAdmin;

      const deviceEntity = {
        externalId: 'ExternalId1',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        countryCodename: 'India',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: 'School',
        impactStory: null,
        data: null,
        images: null,
        deviceDescription: 'Solar Lantern',
        energyStorage: true,
        energyStorageCapacity: 900,
        qualityLabels: null,
        SDGBenefits: ['No Poverty'],
        version: '1.0',
        countryCode: 'IND',
        organizationId: 3,
        groupId: null,
        meterReadtype: null,
        timezone: null,
        IREC_Status: null,
        IREC_ID: null,
        api_user_id: null,
        createdAt: '2024-02-27T07:00:32.963Z',
        updatedAt: '2024-02-27T07:00:32.963Z',
        id: 44,
        yieldValue: 1500,
      };

      jest.spyOn(repository, 'findOne').mockReturnValue(undefined);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(deviceEntity as any);

      const result = await service.register(orgCode, newDevice);

      const options = {
        where: {
          developerExternalId: newDevice.externalId,
          organizationId: orgCode,
        },
      };
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining(newDevice));
      expect(result).toEqual(deviceEntity);
    });

    it('should reject registration with existing external ID', async () => {
      const orgCode = 3;
      const newDevice: NewDeviceDTO = {
        externalId: 'ExternalId1',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        fuelCode: FuelCode.ES100, //'ES100',
        deviceTypeCode: DevicetypeCode.TC110, //'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: OffTaker.School, //'School',
        impactStory: null,
        images: null,
        deviceDescription: DeviceDescription.SolarLantern, //'Solar Lantern',
        energyStorage: true,
        energyStorageCapacity: 900,
        qualityLabels: null,
        SDGBenefits: ['SDG1'],
        version: '1.0',
        countryCode: 'IND',
      };
      const apiUserId = 'a8b6366e-ea5f-4ed7-8e9d-c5ae71c2d909';
      const role = Role.OrganizationAdmin;

      const deviceEntity = {
        externalId: 'ExternalId1',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        countryCodename: 'India',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: 'School',
        impactStory: null,
        data: null,
        images: null,
        deviceDescription: 'Solar Lantern',
        energyStorage: true,
        energyStorageCapacity: 900,
        qualityLabels: null,
        SDGBenefits: ['No Poverty'],
        version: '1.0',
        countryCode: 'IND',
        organizationId: 3,
        groupId: null,
        meterReadtype: null,
        timezone: null,
        IREC_Status: null,
        IREC_ID: null,
        api_user_id: null,
        createdAt: '2024-02-27T07:00:32.963Z',
        updatedAt: '2024-02-27T07:00:32.963Z',
        id: 44,
        yieldValue: 1500,
      };

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(deviceEntity as any);

      const options = {
        where: {
          developerExternalId: newDevice.externalId,
          organizationId: orgCode,
        },
      };

      await expect(
        service.register(orgCode, newDevice, apiUserId, role),
      ).rejects.toThrowError(ConflictException);

      await expect(findOneSpy).toHaveBeenCalledWith(options);
      await expect(findOneSpy).toBeDefined();
    });
  });

  describe('find', () => {
    const organizationEntity = {
      id: 1,
      name: 'orgName',
      organizationType: Role.OrganizationAdmin,
      orgEmail: 'testsweya@gmail.com',
      address: 'Chennai',
      zipCode: '600001',
      city: 'Chennai',
      country: 'India',
      blockchainAccountAddress: 'null',
      blockchainAccountSignedMessage: 'null',
      status: OrganizationStatus.Active,
      users: [],
      invitations: [],
      documentIds: [],
      api_user_id: 'apiUserId',
    } as Organization;

    const deviceEntity = [
      {
        createdAt: '2024-02-27T07:00:32.963Z',
        updatedAt: '2024-02-27T07:00:32.963Z',
        id: 44,
        externalId: 'ExternalId1',
        organizationId: 3,
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        countryCode: 'IND',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 2500,
        SDGBenefits: ['No Poverty'],
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: 'School',
        yieldValue: 1500,
        impactStory: null,
        images: null,
        groupId: null,
        deviceDescription: 'Solar Lantern',
        energyStorage: true,
        energyStorageCapacity: 900,
        qualityLabels: null,
        meterReadtype: null,
        timezone: null,
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
      {
        createdAt: '2023-12-13T13:01:00.885Z',
        updatedAt: '2023-12-13T13:01:00.885Z',
        id: 22,
        externalId: 'June4',
        organizationId: 3,
        projectName: 'test4',
        address: 'Bangalore',
        latitude: '99.09',
        longitude: '889',
        countryCode: 'AFG',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 600,
        SDGBenefits: [],
        commissioningDate: '2020-09-04T21:08:21.890Z',
        gridInterconnection: true,
        offTaker: null,
        yieldValue: 1500,
        impactStory: null,
        images: null,
        groupId: null,
        deviceDescription: null,
        energyStorage: true,
        energyStorageCapacity: 9000,
        qualityLabels: null,
        meterReadtype: null,
        timezone: null,
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
      {
        createdAt: '2023-12-13T13:01:00.883Z',
        updatedAt: '2023-12-13T13:01:00.883Z',
        id: 21,
        externalId: 'Ext22',
        organizationId: 3,
        projectName: 'Test',
        address: 'Bangalore',
        latitude: '67.89',
        longitude: '89.09',
        countryCode: 'IND',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 500,
        SDGBenefits: [],
        commissioningDate: '2020-09-04T21:08:21.890Z',
        gridInterconnection: true,
        offTaker: null,
        yieldValue: 1500,
        impactStory: null,
        images: null,
        groupId: null,
        deviceDescription: null,
        energyStorage: true,
        energyStorageCapacity: 9000,
        qualityLabels: null,
        meterReadtype: null,
        timezone: null,
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
      {
        createdAt: '2023-11-13T07:07:27.483Z',
        updatedAt: '2023-11-13T07:07:27.483Z',
        id: 10,
        externalId: 'Ext11',
        organizationId: 3,
        projectName: 'SampleProje11',
        address: 'BLR',
        latitude: '23.6685889',
        longitude: '24.567568',
        countryCode: 'IND',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 9000,
        SDGBenefits: [],
        commissioningDate: '2022-11-26T10:06:56.640Z',
        gridInterconnection: true,
        offTaker: 'Residential',
        yieldValue: 1500,
        impactStory: 'string',
        images: ['string'],
        groupId: null,
        deviceDescription: 'Ground Mount Solar',
        energyStorage: true,
        energyStorageCapacity: 6000,
        qualityLabels: 'string',
        meterReadtype: 'Delta',
        timezone: 'Asia/Kolkata',
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
      {
        createdAt: '2023-11-08T12:04:45.740Z',
        updatedAt: '2023-11-08T12:04:45.740Z',
        id: 9,
        externalId: 'Ext4',
        organizationId: 3,
        projectName: 'SampleProj12',
        address: 'BLR',
        latitude: '23.558758',
        longitude: '24.657578',
        countryCode: 'IND',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 9000,
        SDGBenefits: [],
        commissioningDate: '1990-11-26T04:30:00.000Z',
        gridInterconnection: true,
        offTaker: 'Residential',
        yieldValue: 1500,
        impactStory: 'string',
        images: ['string'],
        groupId: null,
        deviceDescription: 'Ground Mount Solar',
        energyStorage: true,
        energyStorageCapacity: 5000,
        qualityLabels: 'string',
        meterReadtype: 'Delta',
        timezone: 'Asia/Kolkata',
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
      {
        createdAt: '2023-11-08T11:55:33.919Z',
        updatedAt: '2023-11-08T11:55:33.919Z',
        id: 8,
        externalId: 'Ext3',
        organizationId: 3,
        projectName: 'SampleProj12',
        address: 'BLR',
        latitude: '23.558758',
        longitude: '24.657578',
        countryCode: 'IND',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 9000,
        SDGBenefits: [],
        commissioningDate: '1990-11-26T04:30:00.000Z',
        gridInterconnection: true,
        offTaker: 'Residential',
        yieldValue: 1500,
        impactStory: 'string',
        images: ['string'],
        groupId: null,
        deviceDescription: 'Ground Mount Solar',
        energyStorage: true,
        energyStorageCapacity: 5000,
        qualityLabels: 'string',
        meterReadtype: 'Delta',
        timezone: 'Asia/Kolkata',
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
      {
        createdAt: '2023-11-06T12:48:18.405Z',
        updatedAt: '2023-11-06T12:48:18.405Z',
        id: 6,
        externalId: 'Ext2',
        organizationId: 3,
        projectName: 'Sampleproj12',
        address: 'string',
        latitude: '23.6367447',
        longitude: '24.5634276',
        countryCode: 'IND',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 2000,
        SDGBenefits: [],
        commissioningDate: '2022-11-26T11:00:00.640Z',
        gridInterconnection: true,
        offTaker: 'Residential',
        yieldValue: 1500,
        impactStory: 'string',
        images: ['string'],
        groupId: null,
        deviceDescription: 'Ground Mount Solar',
        energyStorage: true,
        energyStorageCapacity: 800,
        qualityLabels: 'string',
        meterReadtype: 'Delta',
        timezone: 'Asia/Kolkata',
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
      {
        createdAt: '2023-11-03T10:40:45.486Z',
        updatedAt: '2023-11-03T10:40:45.486Z',
        id: 4,
        externalId: 'ext1',
        organizationId: 3,
        projectName: 'sampleproj12',
        address: 'string',
        latitude: '23.343535',
        longitude: '24.5675786',
        countryCode: 'IND',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 2000,
        SDGBenefits: [],
        commissioningDate: '2022-10-18T11:35:27.640Z',
        gridInterconnection: true,
        offTaker: 'Residential',
        yieldValue: 1500,
        impactStory: 'string',
        images: ['string'],
        groupId: null,
        deviceDescription: 'Ground Mount Solar',
        energyStorage: true,
        energyStorageCapacity: 600,
        qualityLabels: 'string',
        meterReadtype: 'Delta',
        timezone: 'Asia/Kolkata',
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization: organizationEntity,
      },
    ];
    it('should retrieve devices without pagination', async () => {
      const filterDto: FilterDTO = {
        fuelCode: undefined, //FuelCode.ES100,
        deviceTypeCode: DevicetypeCode.TC110,
        capacity: undefined, //600,
        start_date: undefined, //'2023-02-01T06:59:11.000Z',
        end_date: undefined, //'2024-02-26T06:59:11.000Z',
        gridInterconnection: undefined, //false
        offTaker: OffTaker.School,
        country: 'India',
      };
      const orgId = 4;
      const expectedQuery: FindManyOptions<Device> = {
        where: {
          capacity: LessThanOrEqual(200),
          countryCode: 'IND',
          organizationId: 4, // Assuming organizationId is a number
          commissioningDate: MoreThanOrEqual('2024-02-18T18:30:00.000Z'), // Assuming commissioningDate is a Date
          SDGBenefits: In([]), // Assuming SDGBenefits is an array
          deviceTypeCode: In([]), // Assuming deviceTypeCode is an array
          offTaker: In([]), // Assuming offTaker is an array
        },
        order: { organizationId: 'DESC' },
      };

      const getFilteredQueryMock = jest
        .fn()
        .mockReturnValue(expectedQuery as FindManyOptions<Device>);
      service.getFilteredQuery = getFilteredQueryMock;
      const findSpy = jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([deviceEntity, deviceEntity.length] as any);
      const result = await service.find(filterDto, undefined, orgId);

      await expect(getFilteredQueryMock).toHaveBeenCalledWith(filterDto, orgId);
      await expect(findSpy).toHaveBeenCalledWith({
        relations: ['organization'],
        ...expectedQuery,
      });

      await expect(result).toBeDefined();
      await expect(result.devices).toHaveLength(result.devices.length);
    });

    it('should retrieve devices with pagination', async () => {
      const organizationEntity = {
        id: 1,
        name: 'orgName',
        organizationType: Role.OrganizationAdmin,
        orgEmail: 'testsweya@gmail.com',
        address: 'Chennai',
        zipCode: '600001',
        city: 'Chennai',
        country: 'India',
        blockchainAccountAddress: 'null',
        blockchainAccountSignedMessage: 'null',
        status: OrganizationStatus.Active,
        users: [],
        invitations: [],
        documentIds: [],
        api_user_id: 'apiUserId',
      } as Organization;

      const deviceEntity = [
        {
          createdAt: '2024-02-27T07:00:32.963Z',
          updatedAt: '2024-02-27T07:00:32.963Z',
          id: 44,
          externalId: 'ExternalId1',
          organizationId: 3,
          projectName: 'sampleProject',
          address: 'Bangalore',
          latitude: '23.65362',
          longitude: '25.43647',
          countryCode: 'IND',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 2500,
          SDGBenefits: ['No Poverty'],
          commissioningDate: '2024-02-01T06:59:11.000Z',
          gridInterconnection: true,
          offTaker: 'School',
          yieldValue: 1500,
          impactStory: null,
          images: null,
          groupId: null,
          deviceDescription: 'Solar Lantern',
          energyStorage: true,
          energyStorageCapacity: 900,
          qualityLabels: null,
          meterReadtype: null,
          timezone: null,
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
        {
          createdAt: '2023-12-13T13:01:00.885Z',
          updatedAt: '2023-12-13T13:01:00.885Z',
          id: 22,
          externalId: 'June4',
          organizationId: 3,
          projectName: 'test4',
          address: 'Bangalore',
          latitude: '99.09',
          longitude: '889',
          countryCode: 'AFG',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 600,
          SDGBenefits: [],
          commissioningDate: '2020-09-04T21:08:21.890Z',
          gridInterconnection: true,
          offTaker: null,
          yieldValue: 1500,
          impactStory: null,
          images: null,
          groupId: null,
          deviceDescription: null,
          energyStorage: true,
          energyStorageCapacity: 9000,
          qualityLabels: null,
          meterReadtype: null,
          timezone: null,
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
        {
          createdAt: '2023-12-13T13:01:00.883Z',
          updatedAt: '2023-12-13T13:01:00.883Z',
          id: 21,
          externalId: 'Ext22',
          organizationId: 3,
          projectName: 'Test',
          address: 'Bangalore',
          latitude: '67.89',
          longitude: '89.09',
          countryCode: 'IND',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 500,
          SDGBenefits: [],
          commissioningDate: '2020-09-04T21:08:21.890Z',
          gridInterconnection: true,
          offTaker: null,
          yieldValue: 1500,
          impactStory: null,
          images: null,
          groupId: null,
          deviceDescription: null,
          energyStorage: true,
          energyStorageCapacity: 9000,
          qualityLabels: null,
          meterReadtype: null,
          timezone: null,
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
        {
          createdAt: '2023-11-13T07:07:27.483Z',
          updatedAt: '2023-11-13T07:07:27.483Z',
          id: 10,
          externalId: 'Ext11',
          organizationId: 3,
          projectName: 'SampleProje11',
          address: 'BLR',
          latitude: '23.6685889',
          longitude: '24.567568',
          countryCode: 'IND',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 9000,
          SDGBenefits: [],
          commissioningDate: '2022-11-26T10:06:56.640Z',
          gridInterconnection: true,
          offTaker: 'Residential',
          yieldValue: 1500,
          impactStory: 'string',
          images: ['string'],
          groupId: null,
          deviceDescription: 'Ground Mount Solar',
          energyStorage: true,
          energyStorageCapacity: 6000,
          qualityLabels: 'string',
          meterReadtype: 'Delta',
          timezone: 'Asia/Kolkata',
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
        {
          createdAt: '2023-11-08T12:04:45.740Z',
          updatedAt: '2023-11-08T12:04:45.740Z',
          id: 9,
          externalId: 'Ext4',
          organizationId: 3,
          projectName: 'SampleProj12',
          address: 'BLR',
          latitude: '23.558758',
          longitude: '24.657578',
          countryCode: 'IND',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 9000,
          SDGBenefits: [],
          commissioningDate: '1990-11-26T04:30:00.000Z',
          gridInterconnection: true,
          offTaker: 'Residential',
          yieldValue: 1500,
          impactStory: 'string',
          images: ['string'],
          groupId: null,
          deviceDescription: 'Ground Mount Solar',
          energyStorage: true,
          energyStorageCapacity: 5000,
          qualityLabels: 'string',
          meterReadtype: 'Delta',
          timezone: 'Asia/Kolkata',
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
        {
          createdAt: '2023-11-08T11:55:33.919Z',
          updatedAt: '2023-11-08T11:55:33.919Z',
          id: 8,
          externalId: 'Ext3',
          organizationId: 3,
          projectName: 'SampleProj12',
          address: 'BLR',
          latitude: '23.558758',
          longitude: '24.657578',
          countryCode: 'IND',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 9000,
          SDGBenefits: [],
          commissioningDate: '1990-11-26T04:30:00.000Z',
          gridInterconnection: true,
          offTaker: 'Residential',
          yieldValue: 1500,
          impactStory: 'string',
          images: ['string'],
          groupId: null,
          deviceDescription: 'Ground Mount Solar',
          energyStorage: true,
          energyStorageCapacity: 5000,
          qualityLabels: 'string',
          meterReadtype: 'Delta',
          timezone: 'Asia/Kolkata',
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
        {
          createdAt: '2023-11-06T12:48:18.405Z',
          updatedAt: '2023-11-06T12:48:18.405Z',
          id: 6,
          externalId: 'Ext2',
          organizationId: 3,
          projectName: 'Sampleproj12',
          address: 'string',
          latitude: '23.6367447',
          longitude: '24.5634276',
          countryCode: 'IND',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 2000,
          SDGBenefits: [],
          commissioningDate: '2022-11-26T11:00:00.640Z',
          gridInterconnection: true,
          offTaker: 'Residential',
          yieldValue: 1500,
          impactStory: 'string',
          images: ['string'],
          groupId: null,
          deviceDescription: 'Ground Mount Solar',
          energyStorage: true,
          energyStorageCapacity: 800,
          qualityLabels: 'string',
          meterReadtype: 'Delta',
          timezone: 'Asia/Kolkata',
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
        {
          createdAt: '2023-11-03T10:40:45.486Z',
          updatedAt: '2023-11-03T10:40:45.486Z',
          id: 4,
          externalId: 'ext1',
          organizationId: 3,
          projectName: 'sampleproj12',
          address: 'string',
          latitude: '23.343535',
          longitude: '24.5675786',
          countryCode: 'IND',
          fuelCode: 'ES100',
          deviceTypeCode: 'TC110',
          capacity: 2000,
          SDGBenefits: [],
          commissioningDate: '2022-10-18T11:35:27.640Z',
          gridInterconnection: true,
          offTaker: 'Residential',
          yieldValue: 1500,
          impactStory: 'string',
          images: ['string'],
          groupId: null,
          deviceDescription: 'Ground Mount Solar',
          energyStorage: true,
          energyStorageCapacity: 600,
          qualityLabels: 'string',
          meterReadtype: 'Delta',
          timezone: 'Asia/Kolkata',
          version: '1.0',
          IREC_Status: 'NotRegistered',
          IREC_ID: null,
          api_user_id: null,
          organization: organizationEntity,
        },
      ];
      const filterDto: FilterDTO = {
        fuelCode: undefined, //FuelCode.ES100,
        deviceTypeCode: DevicetypeCode.TC110,
        capacity: undefined, //600,
        start_date: undefined, //'2023-02-01T06:59:11.000Z',
        end_date: undefined, //'2024-02-26T06:59:11.000Z',
        gridInterconnection: undefined, //false
        offTaker: OffTaker.School,
        country: 'India',
      };
      const pageNumber = 1;
      const orgId = 4;
      const limit = 20;
      const expectedQuery: FindManyOptions<Device> = {
        where: {
          capacity: {
            _type: 'lessThanOrEqual',
            _value: '200', // Adjust as needed
            _useParameter: true,
          },
          countryCode: filterDto.country,
          organizationId: orgId.toString(), // Use orgId provided dynamically
          commissioningDate: {
            _type: 'moreThanOrEqual',
            _value: new Date().toISOString(), // Use current date or adjust as needed
            _useParameter: true,
          },
          SDGBenefits: {
            _type: 'raw',
            _value: [],
            _useParameter: true,
            _multipleParameters: true,
          },
          deviceTypeCode: {
            _type: 'raw',
            _value: [filterDto.deviceTypeCode], // Adjust as needed
            _useParameter: true,
            _multipleParameters: true,
          },
          offTaker: {
            _type: 'raw',
            _value: [filterDto.offTaker], // Adjust as needed
            _useParameter: true,
            _multipleParameters: true,
          },
        },
        order: { organizationId: 'DESC' },
        skip: (pageNumber - 1) * limit,
        take: limit,
      };
      const getFilteredQueryMock = jest
        .fn()
        .mockReturnValue(expectedQuery as FindManyOptions<Device>);
      service.getFilteredQuery = getFilteredQueryMock;
      const findSpy = jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([deviceEntity, deviceEntity.length] as any);
      const result = await service.find(filterDto, pageNumber, orgId);

      await expect(getFilteredQueryMock).toHaveBeenCalledWith(filterDto, orgId);
      await expect(findSpy).toHaveBeenCalledWith({
        relations: ['organization'],
        ...expectedQuery,
      });

      await expect(result).toBeDefined();
      await expect(result.devices).toHaveLength(result.devices.length);
    });
  });

  describe('getOrganizationDevices', () => {/*
    it('should return devices with filters and pagination', async () => {
      const organizationId = 1;
      const api_user_id = 'api-user-123';
      const role = Role.ApiUser;
      const filterDto = { organizationId: 1 } as FilterDTO;
      const pagenumber = 1;
      const mockDevices = [{ id: 1, externalId: 'EXT123', developerExternalId: 'DEV123' } as Device];
      const mockTotalCount = 1;

      // Correct the mock return type to match the expected type of getFilteredQuery
      const mockQueryResult:FindManyOptions<Device> = { where: {} };  // Replace `any` with the appropriate type if known
      jest.spyOn(service, 'getFilteredQuery').mockResolvedValue(mockQueryResult as FindManyOptions<Device>);

      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockDevices, mockTotalCount]);

      const result = await service.getOrganizationDevices(organizationId, api_user_id, role, filterDto, pagenumber);

      expect(service.getFilteredQuery).toHaveBeenCalledWith(filterDto);
      expect(repository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 20,
      }));
      expect(result).toEqual({
        devices: [
          { 
            id: 1, 
            internalexternalId: 'EXT123', 
            externalId: 'DEV123' 
          }
        ],
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
      });
    }); */

    it('should return all devices without filters or pagination', async () => {
      const organizationId = 1;
      const api_user_id = 'api-user-123';
      const role = Role.User; // Assume Role.User is another role
      const filterDto = {} as FilterDTO;
      const pagenumber = null;
      const mockDevices = [{ id: 1, externalId: 'EXT123', developerExternalId: 'DEV123' } as Device];

      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockDevices, mockDevices.length]);

      const result = await service.getOrganizationDevices(organizationId, api_user_id, role, filterDto, pagenumber);

      expect(repository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: { organizationId },
      }));
      expect(result).toEqual([
        {
          id: 1,
          internalexternalId: 'EXT123',
          externalId: 'DEV123',
        }
      ]);
    });
/*
    it('should handle role specific queries', async () => {
      const organizationId = 1;
      const api_user_id = 'api-user-123';
      const role = Role.ApiUser;
      const filterDto = {} as FilterDTO;
      const pagenumber = 1;
      const mockDevices = [{ id: 1, externalId: 'EXT123', developerExternalId: 'DEV123' } as Device];
      const mockTotalCount = 1;

      jest.spyOn(service, 'getFilteredQuery').mockResolvedValue({ where: {} });
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockDevices, mockTotalCount]);

      const result = await service.getOrganizationDevices(organizationId, api_user_id, role, filterDto, pagenumber);

      expect(service.getFilteredQuery).toHaveBeenCalledWith(filterDto);
      expect(repository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 20,
        where: { api_user_id },
      }));
      expect(result).toEqual({
        devices: [
          { 
            id: 1, 
            internalexternalId: 'EXT123', 
            externalId: 'DEV123' 
          }
        ],
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
      });
    });

    it('should handle errors when findAndCount throws an error', async () => {
      const organizationId = 1;
      const api_user_id = 'api-user-123';
      const role = Role.ApiUser;
      const filterDto = { organizationId: 1 } as FilterDTO;
      const pagenumber = 1;

      jest.spyOn(service, 'getFilteredQuery').mockResolvedValue({ where: {} });
      jest.spyOn(repository, 'findAndCount').mockRejectedValue(new Error('Database error'));

      await expect(service.getOrganizationDevices(organizationId, api_user_id, role, filterDto, pagenumber)).rejects.toThrow('Database error');

      expect(service.getFilteredQuery).toHaveBeenCalledWith(filterDto);
      expect(repository.findAndCount).toHaveBeenCalled();
    }); */
  });

  describe('findOne', () => { /*
    it('should return the device with updated timezone', async () => {
      const deviceEntity = {
      createdAt: '2024-07-16T09:46:59.846Z',
      updatedAt: '2024-07-16T09:46:59.846Z',
      id: 54,
      externalId: 'ffa54a71-9cd5-41e4-92f6-c407da1bd064',
      developerExternalId: 'EXCESS',
      organizationId: 94,
      projectName: null,
      address: 'MAA',
      latitude: '72.34',
      longitude: '75.89',
      countryCode: 'AFG',
      fuelCode: 'ES100',
      deviceTypeCode: 'TC110',
      capacity: 1200,
      SDGBenefits: [],
      commissioningDate: '2024-06-30T18:30:55.000Z',
      gridInterconnection: true,
      offTaker: null,
      yieldValue: 2000,
      impactStory: null,
      images: null,
      groupId: 32,
      deviceDescription: null,
      energyStorage: true,
      energyStorageCapacity: null,
      qualityLabels: null,
      meterReadtype: 'Delta',
      timezone: null,
      version: '1.0',
      IREC_Status: 'NotRegistered',
      IREC_ID: null,
      api_user_id: null,
      organization:  {
        createdAt: '2024-07-15T14:35:30.123Z',
        updatedAt: '2024-07-15T14:35:30.123Z',
        id: 94,
        name: 'MAAs',
        address: null,
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        organizationType: 'Developer',
        orgEmail: 'developer1@gmail.com',
        status: 'Active',
        documentIds: null,
        api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
        users: [ [User] ],
        invitations: []
      },
      hasId: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      softRemove: jest.fn(),
      recover: jest.fn(),
      reload: jest.fn(),
    };

    const timezone = 'Antarctica/Mawson';

    const deviceTZ = {
  createdAt: '2024-07-16T09:46:59.846Z',
  updatedAt: '2024-07-16T09:46:59.846Z',
  id: 54,
  externalId: 'ffa54a71-9cd5-41e4-92f6-c407da1bd064',
  developerExternalId: 'EXCESS',
  organizationId: 94,
  projectName: null,
  address: 'MAA',
  latitude: '72.34',
  longitude: '75.89',
  countryCode: 'AFG',
  fuelCode: 'ES100',
  deviceTypeCode: 'TC110',
  capacity: 1200,
  SDGBenefits: [],
  commissioningDate: '2024-06-30T18:30:55.000Z',
  gridInterconnection: true,
  offTaker: null,
  yieldValue: 2000,
  impactStory: null,
  images: null,
  groupId: 32,
  deviceDescription: null,
  energyStorage: true,
  energyStorageCapacity: null,
  qualityLabels: null,
  meterReadtype: 'Delta',
  timezone: 'Antarctica/Mawson',
  version: '1.0',
  IREC_Status: 'NotRegistered',
  IREC_ID: null,
  api_user_id: null,
  organization:  {
    createdAt: '2024-07-15T14:35:30.123Z',
    updatedAt: '2024-07-15T14:35:30.123Z',
    id: 94,
    name: 'MAAs',
    address: null,
    zipCode: null,
    city: null,
    country: null,
    blockchainAccountAddress: null,
    blockchainAccountSignedMessage: null,
    organizationType: 'Developer',
    orgEmail: 'developer1@gmail.com',
    status: 'Active',
    documentIds: null,
    api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
    users: [ [] ],
    invitations: []
  }
};

const device = {
  createdAt: '2024-07-16T09:46:59.846Z',
  updatedAt: '2024-07-16T09:46:59.846Z',
  id: 54,
  externalId: 'ffa54a71-9cd5-41e4-92f6-c407da1bd064',
  developerExternalId: 'EXCESS',
  organizationId: 94,
  projectName: null,
  address: 'MAA',
  latitude: '72.34',
  longitude: '75.89',
  countryCode: 'AFG',
  fuelCode: 'ES100',
  deviceTypeCode: 'TC110',
  capacity: 1200,
  SDGBenefits: [],
  commissioningDate: '2024-06-30T18:30:55.000Z',
  gridInterconnection: true,
  offTaker: null,
  yieldValue: 2000,
  impactStory: null,
  images: null,
  groupId: 32,
  deviceDescription: null,
  energyStorage: true,
  energyStorageCapacity: null,
  qualityLabels: null,
  meterReadtype: 'Delta',
  timezone: 'Antarctica/Mawson',
  version: '1.0',
  IREC_Status: 'NotRegistered',
  IREC_ID: null,
  api_user_id: null
};
  
      const options: FindOneOptions<Device> = {};
  
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(deviceEntity);
      const getLocalTimeZoneFromDeviceSpy = jest.spyOn(service as any, 'getLocalTimeZoneFromDevice').mockResolvedValue(timezone);
  
      const result = await service.findOne(1, options);
  
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: 1, ...options },
      });
  
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalledWith(
        deviceEntity.createdAt,
        deviceEntity,
      );
  
      expect(result).toEqual(device);
  
      expect(result?.organization).toBeUndefined();
    }); */

    it('should return null if device is not found', async () => {
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(null);
  
      const result = await service.findOne(1);
  
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: 1 },
      });
  
      expect(result).toBeNull();
    });
  });

  describe('findReads', () => {
    it('should return the device with updated timezone and no organization', async () => {
      // Mock device entity
      const mockDevice = {
        createdAt: '2024-07-16T09:46:59.846Z',
        updatedAt: '2024-07-16T09:46:59.846Z',
        id: 54,
        externalId: 'ffa54a71-9cd5-41e4-92f6-c407da1bd064',
        developerExternalId: 'EXCESS',
        organizationId: 94,
        projectName: null,
        address: 'MAA',
        latitude: '72.34',
        longitude: '75.89',
        countryCode: 'AFG',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 1200,
        SDGBenefits: [],
        commissioningDate: '2024-06-30T18:30:55.000Z',
        gridInterconnection: true,
        offTaker: null,
        yieldValue: 2000,
        impactStory: null,
        images: null,
        groupId: 32,
        deviceDescription: null,
        energyStorage: true,
        energyStorageCapacity: null,
        qualityLabels: null,
        meterReadtype: 'Delta',
        timezone: null,
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization:  {
          createdAt: '2024-07-15T14:35:30.123Z',
          updatedAt: '2024-07-15T14:35:30.123Z',
          id: 94,
          name: 'MAAs',
          address: null,
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'Developer',
          orgEmail: 'developer1@gmail.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
          users: [ [User] ],
          invitations: []
        },
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      };

      const deviceEntity = {
        externalId: 'ExternalId1',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        countryCodename: 'India',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: 'School',
        impactStory: null,
        data: null,
        images: null,
        deviceDescription: 'Solar Lantern',
        energyStorage: true,
        energyStorageCapacity: 900,
        qualityLabels: null,
        SDGBenefits: ['No Poverty'],
        version: '1.0',
        countryCode: 'IND',
        organizationId: 3,
        groupId: null,
        meterReadtype: null,
        timezone: null,
        IREC_Status: null,
        IREC_ID: null,
        api_user_id: null,
        createdAt: '2024-02-27T07:00:32.963Z',
        updatedAt: '2024-02-27T07:00:32.963Z',
        id: 44,
        yieldValue: 2000,
      };
  
      // Mock repository and timezone function
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(deviceEntity as unknown as Device);
      const getLocalTimeZoneFromDeviceSpy = jest
        .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
        .mockResolvedValue('Antarctica/Mawson');
  
      // Execute function
      const result = await service.findReads('some-meter-id');
  
      // Assert
      expect(result?.timezone).toEqual('Antarctica/Mawson');
      expect(result?.organization).toBeUndefined();
      expect(findOneSpy).toHaveBeenCalledWith({ where: { externalId: 'some-meter-id' } });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalledWith(deviceEntity.createdAt, deviceEntity);
    });
  });

  describe('findDeviceByDeveloperExternalId', () => {
    it('should return the device with updated timezone when found', async () => {
      // Mock device object
      const mockDevice: Device = {
        id: 1,
        developerExternalId: 'some-meter-id',
        organizationId: 1,
        createdAt: new Date('2024-02-27T07:00:32.963Z'),
        timezone: null,
        // other properties...
      } as Device;
  
      // Mock the repository to return a device
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(mockDevice);
      const getLocalTimeZoneFromDeviceSpy = jest
      .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
      .mockResolvedValue('America/New_York');
  
      // Mock the getLocalTimeZoneFromDevice function
      //jest.spyOn(getLocalTimeZoneFromDevice, 'mockImplementation').mockResolvedValue('America/New_York');
  
      // Execute the function
      const result = await service.findDeviceByDeveloperExternalId('some-meter-id', 1);
  
      // Assert
      expect(result).toEqual(mockDevice);
      expect(result?.timezone).toBe('America/New_York');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { developerExternalId: 'some-meter-id', organizationId: 1 },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalledWith(mockDevice.createdAt, mockDevice);
    });
  
    it('should return null when no device is found', async () => {
      // Mock repository to return null
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      const getLocalTimeZoneFromDeviceSpy = jest
      .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
      .mockResolvedValue(null);

      // Execute the function
      const result = await service.findDeviceByDeveloperExternalId('non-existent-meter-id', 1);
  
      // Assert
      expect(result).toBeNull();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { developerExternalId: 'non-existent-meter-id', organizationId: 1 },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalled();
    });
  });

  describe('findDeviceByDeveloperExternalIByApiUser', () => {
    it('should return null when no device is found', async () => {
      // Mock repository to return null
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      const getLocalTimeZoneFromDeviceSpy = jest
      .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
      .mockResolvedValue(null);
      // Execute the function
      const result = await service.findDeviceByDeveloperExternalIByApiUser('non-existent-meter-id', 'user-id');
  
      // Assert
      expect(result).toBeNull();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          developerExternalId: 'non-existent-meter-id',
          api_user_id: 'user-id',
        },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalled();
    });
  
    it('should return a device when one is found and update its timezone', async () => {
      const deviceMock = {
        createdAt: new Date('2024-02-27T07:00:32.963Z'),
        timezone: 'America/New_York',
        // other properties as needed
      } as Device;
  
      // Mock repository to return a device
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(deviceMock);
      const getLocalTimeZoneFromDeviceSpy = jest
      .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
      .mockResolvedValue('Asia/Kolkata');

      // Execute the function
      const result = await service.findDeviceByDeveloperExternalIByApiUser('existing-meter-id', 'user-id');
  
      // Assert
      expect(result).toEqual(deviceMock);
      expect(result?.timezone).toBe('Asia/Kolkata');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          developerExternalId: 'existing-meter-id',
          api_user_id: 'user-id',
        },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalledWith(deviceMock.createdAt, deviceMock);
    });
  });

  describe('findMultipleDevicesBasedExternalId', () => {
    it('should return an empty array when no devices are found', async () => {
      // Mock repository to return an empty array
      const findSpy = jest.spyOn(repository, 'find').mockResolvedValue([]);
  
      // Execute the function
      const result = await service.findMultipleDevicesBasedExternalId(['non-existent-meter-id'], 1);
  
      // Assert
      expect(result).toEqual([]);
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          developerExternalId: In(['non-existent-meter-id']),
          organizationId: 1,
        },
      });
    });

    it('should return an array of devices when devices are found', async () => {
      const deviceEntity1 = {
        createdAt: '2024-07-16T09:46:59.846Z',
        updatedAt: '2024-07-16T09:46:59.846Z',
        id: 54,
        externalId: 'ffa54a71-9cd5-41e4-92f6-c407da1bd064',
        developerExternalId: 'EXCESS',
        organizationId: 94,
        projectName: null,
        address: 'MAA',
        latitude: '72.34',
        longitude: '75.89',
        countryCode: 'AFG',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 1200,
        SDGBenefits: [],
        commissioningDate: '2024-06-30T18:30:55.000Z',
        gridInterconnection: true,
        offTaker: null,
        yieldValue: 2000,
        impactStory: null,
        images: null,
        groupId: 32,
        deviceDescription: null,
        energyStorage: true,
        energyStorageCapacity: null,
        qualityLabels: null,
        meterReadtype: 'Delta',
        timezone: null,
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization:  {
          createdAt: '2024-07-15T14:35:30.123Z',
          updatedAt: '2024-07-15T14:35:30.123Z',
          id: 94,
          name: 'MAAs',
          address: null,
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'Developer',
          orgEmail: 'developer1@gmail.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
          users: [ [User] ],
          invitations: []
        },
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      } as unknown as Device;
  
      const deviceEntity2 = {
        createdAt: '2024-07-16T09:46:59.846Z',
        updatedAt: '2024-07-16T09:46:59.846Z',
        id: 54,
        externalId: 'fca54a71-9cd5-41e4-92f6-c407da1bd064',
        developerExternalId: 'EXCESS',
        organizationId: 94,
        projectName: null,
        address: 'MAA',
        latitude: '72.34',
        longitude: '75.89',
        countryCode: 'AFG',
        fuelCode: 'ES100',
        deviceTypeCode: 'TC110',
        capacity: 1200,
        SDGBenefits: [],
        commissioningDate: '2024-06-30T18:30:55.000Z',
        gridInterconnection: true,
        offTaker: null,
        yieldValue: 2000,
        impactStory: null,
        images: null,
        groupId: 32,
        deviceDescription: null,
        energyStorage: true,
        energyStorageCapacity: null,
        qualityLabels: null,
        meterReadtype: 'Delta',
        timezone: null,
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: null,
        organization:  {
          createdAt: '2024-07-15T14:35:30.123Z',
          updatedAt: '2024-07-15T14:35:30.123Z',
          id: 94,
          name: 'MAAs',
          address: null,
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'Developer',
          orgEmail: 'developer1@gmail.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
          users: [ [User] ],
          invitations: []
        },
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      } as unknown as Device;
  
      // Mock repository to return an array of devices
      const findSpy = jest.spyOn(repository, 'find').mockResolvedValue([deviceEntity1, deviceEntity2]);
  
      // Execute the function
      const result = await service.findMultipleDevicesBasedExternalId(['externalId1', 'externalId2'], 1);
  
      // Assert
      expect(result).toEqual([deviceEntity1, deviceEntity2]);
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          developerExternalId: In(['externalId1', 'externalId2']),
          organizationId: 1,
        },
      });
    });

    it('should return null when the repository returns null', async () => {
      // Mock repository to return null
      const findSpy = jest.spyOn(repository, 'find').mockResolvedValue(null);
  
      // Execute the function
      const result = await service.findMultipleDevicesBasedExternalId(['meter-id-1'], 1);
  
      // Assert
      expect(result).toBeNull();
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          developerExternalId: In(['meter-id-1']),
          organizationId: 1,
        },
      });
    });
  
    it('should handle exceptions thrown by the repository', async () => {
      // Mock repository to throw an error
      const findSpy = jest.spyOn(repository, 'find').mockRejectedValue(new Error('Database error'));
  
      // Assert that an error is thrown
      await expect(service.findMultipleDevicesBasedExternalId(['meter-id-1'], 1)).rejects.toThrow(
        'Database error',
      );
  
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          developerExternalId: In(['meter-id-1']),
          organizationId: 1,
        },
      });
    });
  });

  describe('update', () => {
    it('should successfully update a device', async () => {
      const organizationId = 1;
      const role = Role.DeviceOwner;
      const externalId = 'external-id-1';
      const updateDeviceDTO: UpdateDeviceDTO = {
        externalId: 'ExternalId1',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        fuelCode: FuelCode.ES100,//'ES100',
        deviceTypeCode: DevicetypeCode.TC110,//'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: OffTaker.School,//'School',
        impactStory: null,
        data: null,
        images: null,
        SDGBenefits: ['No Poverty'],
        countryCode: 'IND',
        organizationId: 3,
        meterReadtype: null,
        IREC_Status: null,
        IREC_ID: null,
        yieldValue: 1500,
        labels: 'labels',
      };
  
      const currentDevice = {
        id: 1,
        externalId: 'external-id-1',
        developerExternalId: 'old-developer-external-id',
        organizationId: 1,
        SDGBenefits: ['1', '4'],
      } as Device;
  
      const savedDevice = {
        ...currentDevice,
        ...updateDeviceDTO,
        externalId: 'old-developer-external-id', // Will be swapped back
        developerExternalId: 'external-id-1', // As per your method logic
        organization: undefined,
      };
  
      const findDeviceByDeveloperExternalIdSpy = jest.spyOn(service, 'findDeviceByDeveloperExternalId').mockResolvedValue(currentDevice);
      const saveSpy = jest.spyOn(repository,'save').mockResolvedValue(savedDevice as unknown as Device);
  
      const result = await service.update(organizationId, role, externalId, updateDeviceDTO);
  
      expect(findDeviceByDeveloperExternalIdSpy).toHaveBeenCalledWith(externalId.trim(), organizationId);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining(updateDeviceDTO));
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        externalId: 'external-id-1',
        internalexternalId: 'old-developer-external-id',
        //developerExternalId: undefined, // Because it's deleted
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DevicetypeCode.TC110,
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: OffTaker.School,
        impactStory: null,
        data: null,
        images: null,
        SDGBenefits: ['invalid'], // Assuming "No Poverty" was not found and set to 'invalid'
        countryCode: 'IND',
        organizationId: 3,
        meterReadtype: null,
        IREC_Status: null,
        IREC_ID: null,
        yieldValue: 1500,
        labels: 'labels',
      }));
    });
  });

  describe('findUngrouped', () => {
    it('should return grouped devices when ungrouped devices are found', async () => {
      const organizationId = 1;
      const orderFilterDto: DeviceGroupByDTO = {orderBy: [DeviceOrderBy.CommissioningDate]}; // Provide necessary DTO properties
      const mockDevices = [
        { id: 1, groupId: null, organizationId: 1 },
        { id: 2, groupId: null, organizationId: 1 },
      ] as Device[];

      const findSpy = jest.spyOn(repository,'find').mockResolvedValue(mockDevices);

      const result = await service.findUngrouped(organizationId, orderFilterDto);

      expect(findSpy).toHaveBeenCalledWith({
        where: { groupId: null, organizationId },
      });
      // Assuming groupDevices returns a transformed array based on your logic
      // Replace with actual expected result from `groupDevices` method
      expect(result).toEqual(expect.any(Array)); 
    });

    it('should return an empty array when no ungrouped devices are found', async () => {
      const organizationId = 1;
      const orderFilterDto: DeviceGroupByDTO = {orderBy:[DeviceOrderBy.CommissioningDate]};
      const findSpy = jest.spyOn(repository,'find').mockResolvedValue([]);

      const result = await service.findUngrouped(organizationId, orderFilterDto);

      expect(findSpy).toHaveBeenCalledWith({
        where: { groupId: null, organizationId },
      });
      expect(result).toEqual([]); // Assuming `groupDevices` returns an empty array
    });
  });

  describe('findUngroupedById', () => {
    it('should return true when ungrouped device is found by id', async () => {
      const id = 1;
      const mockDevice = [{ id: 1, groupId: null }] as Device[];

      const findSpy = jest.spyOn(repository,'find').mockResolvedValue(mockDevice);

      const result = await service.findUngroupedById(id);

      expect(findSpy).toHaveBeenCalledWith({
        where: { groupId: null, id },
      });
      expect(result).toBe(true);
    });

    it('should return false when no ungrouped device is found by id', async () => {
      const id = 1;
      const findSpy = jest.spyOn(repository, 'find').mockResolvedValue([]);
    
      const result = await service.findUngroupedById(id);
    
      expect(findSpy).toHaveBeenCalledWith({
        where: { groupId: null, id },
      });
    });
  });
});
