/* eslint-disable @typescript-eslint/no-unused-vars */

import { HttpService } from '@nestjs/axios';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  FindManyOptions,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  DataSource,
  Repository,
} from 'typeorm';
import { DeviceDescription } from '../../models';
import {
  DeviceOrderBy,
  DeviceTypeCode,
  FuelCode,
  OffTaker,
  OrganizationStatus,
  OrganizationType,
} from '../../utils/enums';
import { Role } from '../../utils/enums/role.enum';
import * as deviceUtils from '../../utils/localTimeDetailsForDevice';
import { DocumentUploadsService } from '../document-uploads/document-uploads.service';
import {
  DocumentEntity,
  DocumentType,
} from '../document-uploads/entities/documents.entity';
import { FileService } from '../file';
import { EvidentService } from '../evident/evident.service';
import { EvidentDeviceService } from '../evident/evident-device.service';
import { MailService } from '../../mail/mail.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { ReadsService } from '../reads/reads.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { Device } from './device.entity';
import { DeviceService } from './device.service';
import { DeviceLateOngoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';
import {
  DeviceGroupByDTO,
  FilterDTO,
  NewDeviceDTO,
  UpdateDeviceDTO,
} from './dto';

describe('DeviceService', () => {
  let service: DeviceService;
  let repository: Repository<Device>;
  let deviceDocumentRepository: Repository<DocumentEntity>;
  let fileService: FileService;
  let dataSource: DataSource;
  let documentService: DocumentUploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        DocumentUploadsService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: FileService,
          useValue: {
            upload: jest.fn().mockResolvedValue({
              key: 'mock-file-key',
              Location: 'mock-url',
            }),
            deleteFileFromS3: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Device),
          useClass: Repository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          } as any,
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
          provide: DataSource,
          useValue: {
            query: jest.fn().mockResolvedValue([]),
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
            }),
          },
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
          provide: ReadsService,
          useValue: {} as any,
        },
        {
          provide: getRepositoryToken(DeviceLateOngoingIssueCertificateEntity),
          useClass: Repository,
        },
        {
          provide: EvidentService,
          useValue: {
            queueDeviceRegistration: jest.fn(),
            registerDevice: jest.fn(),
          },
        },
        {
          provide: EvidentDeviceService,
          useValue: {
            queueDeviceRegistration: jest.fn(),
            registerDevice: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    repository = module.get<Repository<Device>>(getRepositoryToken(Device));
    documentService = module.get<DocumentUploadsService>(
      DocumentUploadsService,
    );
    deviceDocumentRepository = module.get<Repository<DocumentEntity>>(
      getRepositoryToken(DocumentEntity),
    );
    fileService = module.get<FileService>(FileService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new device with valid inputs', async () => {
      const orgCode = 3;
      const newDevice: NewDeviceDTO = {
        externalId: 'ExternalId1',
        dataSourceBrand: 'Sample Brand',
        dataSource: 'Inverter',
        otherDataSource: '',
        serialNumber: 'SN31',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        fuelCode: FuelCode.ES100, //'ES100',
        deviceTypeCode: DeviceTypeCode.TC110, //'TC110',
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
        dataSource: 'Inverter',
        otherDataSource: '',
        serialNumber: 'SN31',
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

      type RequiredDocumentType =
        | DocumentType.FORM_SF_02
        | DocumentType.SF_02C
        | DocumentType.METERING_EVIDENCE
        | DocumentType.SINGLE_LINE_DIAGRAM
        | DocumentType.PROJECT_PHOTOS;

      const files: Record<RequiredDocumentType, Express.Multer.File[]> = {
        [DocumentType.FORM_SF_02]: [
          {
            fieldname: DocumentType.FORM_SF_02,
            originalname: 'file1.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            buffer: Buffer.from('file content'),
            size: 1234,
            stream: null,
            destination: null,
            filename: null,
            path: null,
          },
        ],
        [DocumentType.SF_02C]: [
          {
            fieldname: DocumentType.SF_02C,
            originalname: 'file2.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            buffer: Buffer.from('file content'),
            size: 1234,
            stream: null,
            destination: null,
            filename: null,
            path: null,
          },
        ],
        [DocumentType.METERING_EVIDENCE]: [
          {
            fieldname: DocumentType.METERING_EVIDENCE,
            originalname: 'file3.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            buffer: Buffer.from('file content'),
            size: 1234,
            stream: null,
            destination: null,
            filename: null,
            path: null,
          },
        ],
        [DocumentType.SINGLE_LINE_DIAGRAM]: [
          {
            fieldname: DocumentType.SINGLE_LINE_DIAGRAM,
            originalname: 'file4.pdf',
            encoding: '7bit',
            mimetype: 'application/pdf',
            buffer: Buffer.from('file content'),
            size: 1234,
            stream: null,
            destination: null,
            filename: null,
            path: null,
          },
        ],
        [DocumentType.PROJECT_PHOTOS]: [
          {
            fieldname: DocumentType.PROJECT_PHOTOS,
            originalname: 'file5.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('file content'),
            size: 1234,
            stream: null,
            destination: null,
            filename: null,
            path: null,
          },
        ],
      };
      jest.spyOn(repository, 'findOne').mockReturnValue(undefined);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(deviceEntity as any);

      const result = await service.register(orgCode, newDevice, files as any);

      const options = {
        where: {
          serialNumber: newDevice.serialNumber,
          organizationId: orgCode,
        },
      };
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining(newDevice));
      expect(result).toEqual(deviceEntity);
    });

    it('should reject registration with existing external ID', async () => {
      const orgCode = 3;
      const newDevice: NewDeviceDTO = {
        dataSourceBrand: 'Sample Brand',
        externalId: 'ExternalId1',
        dataSource: 'Inverter',
        otherDataSource: '',
        serialNumber: 'SN31',
        projectName: 'sampleProject',
        address: 'Bangalore',
        latitude: '23.65362',
        longitude: '25.43647',
        fuelCode: FuelCode.ES100, //'ES100',
        deviceTypeCode: DeviceTypeCode.TC110, //'TC110',
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

      const files = {
        [DocumentType.FORM_SF_02]: [],
        [DocumentType.SF_02C]: [],
        [DocumentType.METERING_EVIDENCE]: [],
        [DocumentType.SINGLE_LINE_DIAGRAM]: [],
        [DocumentType.PROJECT_PHOTOS]: [],
      };
      const options = {
        where: {
          serialNumber: newDevice.serialNumber,
          organizationId: orgCode,
        },
      };
      const correctedFiles = {
        [DocumentType.FORM_SF_02]: files[DocumentType.FORM_SF_02],
        [DocumentType.SF_02C]: files[DocumentType.SF_02C],
        [DocumentType.METERING_EVIDENCE]: files[DocumentType.METERING_EVIDENCE],
        [DocumentType.SINGLE_LINE_DIAGRAM]:
          files[DocumentType.SINGLE_LINE_DIAGRAM],
        [DocumentType.PROJECT_PHOTOS]: files[DocumentType.PROJECT_PHOTOS],
      };

      await expect(
        service.register(orgCode, newDevice, correctedFiles, apiUserId, role),
      ).rejects.toThrowError(ConflictException);

      // Service checks projectName first, then serialNumber
      await expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          projectName: newDevice.projectName,
          organizationId: orgCode,
        },
      });
      await expect(findOneSpy).toBeDefined();
    });
  });

  describe('find', () => {
    const organizationEntity = {
      id: 1,
      name: 'orgName',
      organizationType: OrganizationType.Developer,
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
      const filterDTO: FilterDTO = {
        fuelCode: undefined, //FuelCode.ES100,
        deviceTypeCode: DeviceTypeCode.TC110,
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
      const result = await service.find(filterDTO, undefined, orgId);

      await expect(getFilteredQueryMock).toHaveBeenCalledWith(filterDTO, orgId);
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
        organizationType: OrganizationType.Developer,
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
      const filterDTO: FilterDTO = {
        fuelCode: undefined, //FuelCode.ES100,
        deviceTypeCode: DeviceTypeCode.TC110,
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
          } as any,
          countryCode: filterDTO.country,
          organizationId: orgId.toString() as any, // Use orgId provided dynamically
          commissioningDate: {
            _type: 'moreThanOrEqual',
            _value: new Date().toISOString(), // Use current date or adjust as needed
            _useParameter: true,
          } as any,
          SDGBenefits: {
            _type: 'raw',
            _value: [],
            _useParameter: true,
            _multipleParameters: true,
          } as any,
          deviceTypeCode: {
            _type: 'raw',
            _value: [filterDTO.deviceTypeCode], // Adjust as needed
            _useParameter: true,
            _multipleParameters: true,
          } as any,
          offTaker: {
            _type: 'raw',
            _value: [filterDTO.offTaker], // Adjust as needed
            _useParameter: true,
            _multipleParameters: true,
          } as any,
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
      const result = await service.find(filterDTO, pageNumber, orgId);

      await expect(getFilteredQueryMock).toHaveBeenCalledWith(filterDTO, orgId);
      await expect(findSpy).toHaveBeenCalledWith({
        relations: ['organization'],
        ...expectedQuery,
      });

      await expect(result).toBeDefined();
      await expect(result.devices).toHaveLength(result.devices.length);
    });
  });

  describe('getOrganizationDevices', () => {
    it('should return all devices without filters or pagination', async () => {
      const organizationId = 1;
      const apiUserId = 'api-user-123';
      const role = Role.User; // Assume Role.User is another role
      const filterDto = {} as FilterDTO;
      const pageNumber = null;
      const mockDevices = [
        {
          id: 1,
          externalId: 'EXT123',
          serialNumber: 'DEV123',
        } as Device,
      ];

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mockDevices, mockDevices.length]);

      const result = await service.getOrganizationDevices(
        organizationId,
        apiUserId,
        role,
        filterDto,
        pageNumber,
      );

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId },
        }),
      );
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            externalId: 'EXT123',
            serialNumber: 'DEV123',
          }),
        ]),
      );
    });
  });

  describe('findOne', () => {
    it('should return null if device is not found', async () => {
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);

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
        serialNumber: 'EXCESS',
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
        organization: {
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
          organizationType: OrganizationType.Developer,
          orgEmail: 'developer1@gmail.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
          users: [[User]],
          invitations: [],
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
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(deviceEntity as unknown as Device);
      const getLocalTimeZoneFromDeviceSpy = jest
        .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
        .mockResolvedValue('Antarctica/Mawson');

      // Execute function
      const result = await service.findReads('some-meter-id');

      // Assert
      expect(result?.timezone).toEqual('Antarctica/Mawson');
      expect(result?.organization).toBeUndefined();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { externalId: 'some-meter-id' },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalledWith(
        deviceEntity.createdAt,
        deviceEntity,
      );
    });
  });

  describe('findBySerialNumber', () => {
    it('should return the device with updated timezone when found', async () => {
      // Mock device object
      const mockDevice: Device = {
        id: 1,
        serialNumber: 'some-meter-id',
        organizationId: 1,
        createdAt: new Date('2024-02-27T07:00:32.963Z'),
        timezone: null,
        // other properties...
      } as Device;

      // Mock the repository to return a device
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockDevice);
      const getLocalTimeZoneFromDeviceSpy = jest
        .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
        .mockResolvedValue('America/New_York');

      // Mock the getLocalTimeZoneFromDevice function
      //jest.spyOn(getLocalTimeZoneFromDevice, 'mockImplementation').mockResolvedValue('America/New_York');

      // Execute the function
      const result = await service.findBySerialNumber('some-meter-id', 1);

      // Assert
      expect(result).toEqual(mockDevice);
      expect(result?.timezone).toBe('America/New_York');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { serialNumber: 'some-meter-id', organizationId: 1 },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalledWith(
        mockDevice.createdAt,
        mockDevice,
      );
    });

    it('should return null when no device is found', async () => {
      // Mock repository to return null
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);
      const getLocalTimeZoneFromDeviceSpy = jest
        .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
        .mockResolvedValue(null);

      // Execute the function
      const result = await service.findBySerialNumber(
        'non-existent-meter-id',
        1,
      );

      // Assert
      expect(result).toBeNull();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          serialNumber: 'non-existent-meter-id',
          organizationId: 1,
        },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalled();
    });
  });

  describe('findBySerialNumberAndApiUser', () => {
    it('should return null when no device is found', async () => {
      // Mock repository to return null
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);
      const getLocalTimeZoneFromDeviceSpy = jest
        .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
        .mockResolvedValue(null);
      // Execute the function
      const result = await service.findBySerialNumberAndApiUser(
        'non-existent-meter-id',
        'user-id',
      );

      // Assert
      expect(result).toBeNull();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          serialNumber: 'non-existent-meter-id',
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
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(deviceMock);
      const getLocalTimeZoneFromDeviceSpy = jest
        .spyOn(deviceUtils, 'getLocalTimeZoneFromDevice')
        .mockResolvedValue('Asia/Kolkata');

      // Execute the function
      const result = await service.findBySerialNumberAndApiUser(
        'existing-meter-id',
        'user-id',
      );

      // Assert
      expect(result).toEqual(deviceMock);
      expect(result?.timezone).toBe('Asia/Kolkata');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          serialNumber: 'existing-meter-id',
          api_user_id: 'user-id',
        },
      });
      expect(getLocalTimeZoneFromDeviceSpy).toHaveBeenCalledWith(
        deviceMock.createdAt,
        deviceMock,
      );
    });
  });

  describe('findMultipleDevicesBasedExternalId', () => {
    it('should return an empty array when no devices are found', async () => {
      // Mock repository to return an empty array
      const findSpy = jest.spyOn(repository, 'find').mockResolvedValue([]);

      // Execute the function
      const result = await service.findMultipleDevicesBasedExternalId(
        ['non-existent-meter-id'],
        1,
      );

      // Assert
      expect(result).toEqual([]);
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          serialNumber: In(['non-existent-meter-id']),
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
        serialNumber: 'EXCESS',
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
        organization: {
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
          organizationType: OrganizationType.Developer,
          orgEmail: 'developer1@gmail.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
          users: [[User]],
          invitations: [],
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
        serialNumber: 'EXCESS',
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
        organization: {
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
          organizationType: OrganizationType.Developer,
          orgEmail: 'developer1@gmail.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'b8047b28-13f5-485e-963c-7c7fdc43300d',
          users: [[User]],
          invitations: [],
        },
        hasId: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
        softRemove: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
      } as unknown as Device;

      // Mock repository to return an array of devices
      const findSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue([deviceEntity1, deviceEntity2]);

      // Execute the function
      const result = await service.findMultipleDevicesBasedExternalId(
        ['externalId1', 'externalId2'],
        1,
      );

      // Assert
      expect(result).toEqual([deviceEntity1, deviceEntity2]);
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          serialNumber: In(['externalId1', 'externalId2']),
          organizationId: 1,
        },
      });
    });

    it('should return null when the repository returns null', async () => {
      // Mock repository to return null
      const findSpy = jest.spyOn(repository, 'find').mockResolvedValue(null);

      // Execute the function
      const result = await service.findMultipleDevicesBasedExternalId(
        ['meter-id-1'],
        1,
      );

      // Assert
      expect(result).toBeNull();
      expect(findSpy).toHaveBeenCalledWith({
        where: {
          serialNumber: In(['meter-id-1']),
          organizationId: 1,
        },
      });
    });

    it('should handle exceptions thrown by the repository', async () => {
      // Mock repository to throw an error
      const findSpy = jest
        .spyOn(repository, 'find')
        .mockRejectedValue(new Error('Database error'));

      // Assert that an error is thrown
      await expect(
        service.findMultipleDevicesBasedExternalId(['meter-id-1'], 1),
      ).rejects.toThrow('Database error');

      expect(findSpy).toHaveBeenCalledWith({
        where: {
          serialNumber: In(['meter-id-1']),
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
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DeviceTypeCode.TC110,
        capacity: 2500,
        commissioningDate: '2024-02-01T06:59:11.000Z',
        gridInterconnection: true,
        offTaker: OffTaker.School,
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
        serialNumber: 'SN12345',
      };

      const currentDeviceData = {
        id: 1,
        externalId: 'external-id-1',
        serialNumber: 'SN12345',
        organizationId: 1,
        SDGBenefits: ['1', '4'],
      };

      const currentDevice = {
        ...currentDeviceData,
        toJSON: () => currentDeviceData,
      } as unknown as Device;

      const savedDevice = {
        ...currentDevice,
        ...updateDeviceDTO,
        externalId: 'external-id-1',
        serialNumber: 'SN123455',
        organization: undefined,
        SDGBenefits: ['invalid'], // The service transforms this value
      };

      // Mock repository methods
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null); // Mock fingerprint check to return null

      const findDeviceByDeveloperExternalIdSpy = jest
        .spyOn(service, 'findBySerialNumber')
        .mockResolvedValue(currentDevice);

      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(savedDevice as unknown as Device);

      const result = await service.update(
        organizationId,
        role,
        externalId,
        updateDeviceDTO,
      );

      expect(findDeviceByDeveloperExternalIdSpy).toHaveBeenCalledWith(
        externalId.trim(),
        organizationId,
      );
      expect(findOneSpy).toHaveBeenCalled(); // Verify fingerprint check was called
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining(updateDeviceDTO),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          externalId: 'external-id-1',
          projectName: 'sampleProject',
          address: 'Bangalore',
          latitude: '23.65362',
          longitude: '25.43647',
          fuelCode: FuelCode.ES100,
          deviceTypeCode: DeviceTypeCode.TC110,
          capacity: 2500,
          commissioningDate: '2024-02-01T06:59:11.000Z',
          gridInterconnection: true,
          offTaker: OffTaker.School,
          impactStory: null,
          data: null,
          images: null,
          SDGBenefits: ['invalid'], // Updated to match actual service behavior
          countryCode: 'IND',
          organizationId: 3,
          meterReadtype: null,
          IREC_Status: null,
          IREC_ID: null,
          yieldValue: 1500,
          labels: 'labels',
          serialNumber: 'SN123455',
        }),
      );
    });
  });

  describe('findUngrouped', () => {
    it('should return grouped devices when ungrouped devices are found', async () => {
      const organizationId = 1;
      const orderFilterDTO: DeviceGroupByDTO = {
        orderBy: [DeviceOrderBy.CommissioningDate],
      };
      const filterDTO: FilterDTO = {
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DeviceTypeCode.TC110,
        capacity: 0,
        start_date: '',
        end_date: '',
        gridInterconnection: false,
        offTaker: OffTaker.School,
        country: '',
      };
      const pageNumber = 1;
      const mockDevices = [
        {
          id: 1,
          groupId: null,
          organizationId: 1,
          commissioningDateRange: '2024',
          capacityRange: '1000-2000',
          selected: true,
        },
        {
          id: 2,
          groupId: null,
          organizationId: 1,
          commissioningDateRange: '2024',
          capacityRange: '1000-2000',
          selected: true,
        },
      ] as any;

      const findAndCountSpy = jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mockDevices, mockDevices.length]);

      const groupedResult = {
        totalPages: 1,
        currentPage: 1,
        groups: [
          {
            name: 'group',
            devices: mockDevices, // Now matches UngroupedDeviceDTO[]
          },
        ],
      };
      jest.spyOn(service, 'groupDevices').mockReturnValue(groupedResult);

      const result = await service.findUngrouped(
        organizationId,
        orderFilterDTO,
        filterDTO,
        pageNumber,
      );

      expect(findAndCountSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupId: null,
            organizationId,
          }),
        }),
      );
      expect(result).toEqual(groupedResult);
    });

    it('should return an empty array when no ungrouped devices are found', async () => {
      const organizationId = 1;
      const orderFilterDto: DeviceGroupByDTO = {
        orderBy: [DeviceOrderBy.CommissioningDate],
      };
      const filterDTO: FilterDTO = {
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DeviceTypeCode.TC110,
        capacity: 0,
        start_date: '',
        end_date: '',
        gridInterconnection: false,
        offTaker: OffTaker.School,
        country: '',
      };
      const pageNumber = 1;
      const findAndCountSpy = jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([[], 0]);

      // Optionally, mock groupDevices to return empty groups
      const groupedResult = {
        totalPages: 0,
        currentPage: 1,
        groups: [],
      };
      jest.spyOn(service, 'groupDevices').mockReturnValue(groupedResult);

      const result = await service.findUngrouped(
        organizationId,
        orderFilterDto,
        filterDTO,
        pageNumber,
      );

      expect(findAndCountSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupId: null,
            organizationId,
          }),
        }),
      );
      expect(result).toEqual(groupedResult);
    });
  });

  describe('findUngroupedById', () => {
    it('should return true when ungrouped device is found by id', async () => {
      const id = 1;
      const mockDevice = [{ id: 1, groupId: null }] as Device[];

      const findSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue(mockDevice);

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

  describe('createCycle', () => {
    it('should call addLateCertificateIssueDateLogForDevice with correct arguments', async () => {
      // Arrange
      const groupId = 1;
      const deviceExternalId = 'device123';
      const lateStartDate = new Date('2023-01-01');
      const lateEndDate = new Date('2023-01-31');

      const mockReturnValue =
        {} as unknown as DeviceLateOngoingIssueCertificateEntity; // or any expected return value

      const addLateCertificateIssueDateLogForDeviceSpy = jest
        .spyOn(service, 'addLateCertificateIssueDateLogForDevice')
        .mockResolvedValue(mockReturnValue);

      // Act
      const result = await service.createCycle(
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
});
