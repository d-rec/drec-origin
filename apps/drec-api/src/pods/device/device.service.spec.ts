import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from './device.service';
import { Repository, FindManyOptions } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { Device } from './device.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import {
  HttpService,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { IrecDevicesInformationEntity } from './irec_devices_information.entity';
import { IrecErrorLogInformationEntity } from './irec_error_log_information.entity';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { Role } from '../../utils/enums/role.enum';
import { FilterDTO, NewDeviceDTO } from './dto';
import {
  DevicetypeCode,
  FuelCode,
  OffTaker,
  OrganizationStatus,
} from '../../utils/enums';
import { DeviceDescription } from '../../models';
import { Organization } from '../organization/organization.entity';
import { DeviceLateongoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';

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
        // @ts-ignore
        countryCodename: 'India',
        fuelCode: FuelCode.ES100, //'ES100',
        deviceTypeCode: DevicetypeCode.TC110, //'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: OffTaker.School, //'School',
        impactStory: null,
        data: null,
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
        // @ts-ignore
        countryCodename: 'India',
        fuelCode: FuelCode.ES100, //'ES100',
        deviceTypeCode: DevicetypeCode.TC110, //'TC110',
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: OffTaker.School, //'School',
        impactStory: null,
        data: null,
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
      // @ts-ignore
      organizationType: Role.OrganizationAdmin,
      // @ts-ignore
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
          capacity: {
            _type: 'lessThanOrEqual',
            _value: '200',
            _useParameter: true,
          },
          countryCode: 'IND',
          organizationId: '4',
          commissioningDate: {
            _type: 'moreThanOrEqual',
            _value: '2024-02-18T18:30:00.000Z',
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
            _value: [],
            _useParameter: true,
            _multipleParameters: true,
          },
          offTaker: {
            _type: 'raw',
            _value: [],
            _useParameter: true,
            _multipleParameters: true,
          },
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
        // @ts-ignore
        organizationType: Role.OrganizationAdmin,
        // @ts-ignore
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
});
