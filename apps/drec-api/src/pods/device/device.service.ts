import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Brackets,
  Connection,
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Raw,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Device } from './device.entity';
import { NewDeviceDTO } from './dto/new-device.dto';
import { defaults } from 'lodash';
import {
  DeviceDTO,
  FilterDTO,
  GroupedDevicesDTO,
  UngroupedDeviceDTO,
  UpdateDeviceDTO,
} from './dto';
import {
  DeviceOrderBy,
  DeviceStatus,
  IRECDeviceStatus,
  ReadType,
  Role,
} from '../../utils/enums';
import cleanDeep from 'clean-deep';
import {
  DeviceKey,
  DeviceSortPropertyMapper,
  IREC_DEVICE_TYPES,
  IREC_FUEL_TYPES,
} from '../../models';
import { CodeNameDTO } from './dto/code-name.dto';
import { DeviceGroupByDTO } from './dto/device-group-by.dto';
import { groupByProps } from '../../utils/group-by-properties';
import { getCapacityRange } from '../../utils/get-capacity-range';
import { getDateRangeFromYear } from '../../utils/get-commissioning-date-range';
import { getCodeFromCountry } from '../../utils/getCodeFromCountry';
import { getFuelNameFromCode } from '../../utils/getFuelNameFromCode';
import { getDeviceTypeFromCode } from '../../utils/getDeviceTypeFromCode';
import { regenerateToken } from '../../utils/evident-login';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { InfluxDB } from '@influxdata/influxdb-client';
import { SDGBenefits } from '../../models/Sdgbenefit';
import { v4 as uuid } from 'uuid';
import { HistoryIntermediateMeterRead } from '../reads/history_intermideate_meterread.entity';
import { Observable } from 'rxjs';
import { IRECDevicesInformationEntity } from './irec_devices_information.entity';
import { IRECErrorLogInformationEntity } from './irec_error_log_information.entity';
import { getLocalTimeZoneFromDevice } from '../../utils/localTimeDetailsForDevice';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { DeviceLateOngoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';
import { HttpService } from '@nestjs/axios';
import { Organization } from '../organization/organization.entity';
import { DateTime } from 'luxon';
import { DeviceGroup } from '../device-group/device-group.entity';
import { getCycleEndDate } from '../../lib/helpers/getCycleEndDate';
import {
  DocumentTargetType,
  DocumentType,
} from '../document-uploads/entities/documents.entity';
import { generateDeviceFingerprint } from '../../lib/device';
import { DocumentUploadsService } from '../document-uploads/document-uploads.service';
import { SynchronizeDeviceStatusTaskService } from '../evident/evident.service';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(HistoryIntermediateMeterRead)
    private readonly historyRepository: Repository<HistoryIntermediateMeterRead>,
    @InjectRepository(Device) private readonly repository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly checkDeviceLogCertificateRepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    private httpService: HttpService,
    @InjectRepository(IRECDevicesInformationEntity)
    private readonly irecInfoRepository: Repository<IRECDevicesInformationEntity>,
    @InjectRepository(IRECErrorLogInformationEntity)
    private readonly irecErrorLogRepository: Repository<IRECErrorLogInformationEntity>,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    @InjectRepository(DeviceLateOngoingIssueCertificateEntity)
    private readonly lateDeviceCertificateRepository: Repository<DeviceLateOngoingIssueCertificateEntity>,
    private readonly connection: Connection,
    private readonly documentsService: DocumentUploadsService,
    private readonly evidentService: SynchronizeDeviceStatusTaskService,
  ) {}

  public async find(
    filterDto: FilterDTO,
    pageNumber: number,
    OrgId?: number,
  ): Promise<{ devices: Device[]; currentPage; totalPages; totalCount }> {
    this.logger.verbose(`With in find`);
    const limit = 20;
    let query = await this.getFilteredQuery(filterDto, OrgId);
    if (pageNumber) {
      query = {
        ...query,
        skip: (pageNumber - 1) * limit,
        take: limit,
      };
    }

    const [devices, totalCount] = await this.repository.findAndCount({
      relations: ['organization'],
      ...query,
    });
    const totalPages = Math.ceil(totalCount / 20);
    const currentPage = pageNumber;
    const newDevices = [];

    await devices.map((device: Device) => {
      device['organizationname'] = device.organization.name;
      delete device['organization'];
      newDevices.push(device);
    });

    return {
      devices: newDevices,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  async getOrganizationDevices(
    organizationId: number,
    api_user_id: string,
    role: Role,
    filterDto: FilterDTO,
    pageNumber: number,
  ): Promise<any> {
    this.logger.verbose(`With in getOrganizationDevices`);
    if (
      Object.keys(filterDto).length != 0 &&
      (pageNumber != null || pageNumber != undefined)
    ) {
      const limit = 20;
      const query = await this.getFilteredQuery(filterDto);
      let where: any = query.where;
      if (role == Role.ApiUser) {
        if (filterDto.organizationId) {
          where = { ...where, organizationId };
        } else {
          where = { ...where, api_user_id };
        }
      } else {
        where = { ...where, organizationId };
      }

      query.where = where;
      const [devices, totalCount] = await this.repository.findAndCount({
        ...query,
        skip: (pageNumber - 1) * limit,
        take: limit,
        order: {
          createdAt: 'DESC',
        },
      });

      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = pageNumber;
      const newDevices = [];
      await devices.map((device: Device) => {
        device['internalexternalId'] = device.externalId;
        device.externalId = device.developerExternalId;
        delete device['developerExternalId'];

        delete device['organization'];

        newDevices.push(device);
      });
      return {
        devices: newDevices,
        currentPage,
        totalPages,
        totalCount,
      };
    }
    const [devices] = await this.repository.findAndCount({
      where: { organizationId },
      order: {
        createdAt: 'DESC',
      },
    });

    //devices.externalId = devices.developerExternalId
    const newDevices = [];
    await devices.map((device: Device) => {
      device['internalexternalId'] = device.externalId;
      device.externalId = device.developerExternalId;
      delete device['developerExternalId'];
      delete device['organization'];
      newDevices.push(device);
    });

    return newDevices;
  }

  public getLatestDeviceByOrganization(
    organizationId: number,
  ): Promise<Device[]> {
    this.logger.verbose(`With in getLatestDeviceByOrganization`);
    const result = this.repository.find({
      where: { organizationId },
      order: {
        id: 'DESC',
      },
      take: 1,
    });
    delete result['organization'];
    return result;
  }

  async irecPostData(deviceId: number): Promise<any> {
    this.logger.verbose(`With in I_recPostData`);
    const device = await this.repository.findOne({
      where: { id: deviceId, IREC_Status: 'NotRegistered' },
      order: {
        createdAt: 'DESC',
      },
    });

    if (device) {
      const jwtToken = await regenerateToken(this.httpService);
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      };
      if (device.fuelCode === null) {
        this.logger.error(
          `Device Added Failure in I-REC,Item not found for fuel`,
        );
        return {
          status: false,
          message: 'Device Added Failure in I-REC,Item not found for fuel',
        };
      }
      const requestBody = {
        name: `${device.externalId}`,
        fuel: `/fuels/${device.fuelCode}`,
      };
      const config = {
        headers,
      };

      const url = `${process.env.IREC_EVIDENT_API_URL}/devices`;
      try {
        const response = await this.httpService
          .post(url, requestBody, config)
          .toPromise();
        const data = response.data;
        device.IREC_ID = data.code;
        device.IREC_Status = IRECDeviceStatus.DeviceNameCreated;
        await this.repository.save(device);
        const irecDeviceAddDTO = new IRECDevicesInformationEntity();
        (irecDeviceAddDTO.IREC_id = data.code),
          (irecDeviceAddDTO.event = 'register'),
          (irecDeviceAddDTO.request = requestBody),
          (irecDeviceAddDTO.responses = data);
        await this.irecInfoRepository.save({
          ...irecDeviceAddDTO,
        });
        this.logger.log(`Device Added Successfully in I-REC`);
        return {
          status: true,
          message: 'Device Added Successfully in I-REC',
          IREC_ID: data.code,
        };
      } catch (error) {
        const irecDeviceErrorLogDTO = new IRECErrorLogInformationEntity();

        (irecDeviceErrorLogDTO.event = 'register'),
          (irecDeviceErrorLogDTO.request = requestBody),
          (irecDeviceErrorLogDTO.error_log_responses = error);
        await this.irecErrorLogRepository.save({
          ...irecDeviceErrorLogDTO,
        });
        this.logger.error(`Device Added Failure in I-REC ${error}`);
        return {
          status: false,
          message: 'Device Added Failure in I-REC, ' + error,
        };
      }
    }
  }

  async irecDeviceDetailsPostData(deviceId: number): Promise<Observable<any>> {
    this.logger.verbose(`With in I_RECDeviceDetailsPostData`);
    const device = await this.repository.findOne({
      where: { id: deviceId, IREC_Status: 'DeviceNameCreated' },
      order: {
        createdAt: 'DESC',
      },
    });

    if (device) {
      const jwtToken = await regenerateToken(this.httpService);
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      };
      const irecCapacity = device.capacity / 1000;
      const requestBody = {
        deviceType: '/device_types/' + device.deviceTypeCode,
        fuel: '/fuels/',
        device: '/devices/',
        registrant: '/registrants/',
        issuer: '/issuers/',
        name: device.externalId,
        capacity: irecCapacity,
        supported: true,
        latitude: device.latitude,
        longitude: device.longitude,
        registrationDate: device.createdAt,
        commissioningDate: device.commissioningDate,
        status: IRECDeviceStatus.Submitted,
        active: true,
        address1: device.address,
        country: '/countries/' + device.countryCode,
      };
      const config = {
        headers,
      };

      const url = `${process.env.IREC_EVIDENT_API_URL}/devices`;

      let data: any;
      this.httpService // eslint-disable-line @typescript-eslint/no-unused-vars
        .post(url, requestBody, config)
        .subscribe(
          (response) => {
            data = response.data;
            device.IREC_ID = data.code;
            device.IREC_Status = IRECDeviceStatus.DeviceNameCreated;
          },
          (error) => {
            this.logger.error(error);
          },
        );
      await this.repository.save(device);
      return data;
    }
  }

  public async findForDevicesWithDeviceIdAndOrganizationId(
    deviceIds: Array<number>,
    organizationId: number,
  ): Promise<Device[]> {
    this.logger.verbose(`With in findForDevicesWithDeviceIdAndOrganizationId`);
    const result = this.repository.find({
      where: { id: In(deviceIds), organizationId },
    });

    delete result['organization'];
    return result;
  }

  public async findForGroup(groupId: number): Promise<Device[]> {
    this.logger.verbose(`With in findForGroup`);
    const result = await this.repository.find({
      where: { groupId },
      order: {
        createdAt: 'DESC',
      },
    });
    delete result['organization'];
    return result;
  }
  public async newFindForGroup(
    groupId: number,
  ): Promise<{ [key: string]: Device[] }> {
    this.logger.verbose(`With in NewfindForGroup`);
    let groupDevice: Array<any> = await this.repository.find({
      where: { groupId },
      order: {
        createdAt: 'DESC',
      },
    });
    groupDevice = groupDevice.filter(
      (ele) =>
        ele.meterReadtype == ReadType.Delta ||
        ele.meterReadtype == ReadType.ReadMeter,
    );

    const deviceGroupedByCountry = this.groupBy(groupDevice, 'countryCode');
    return deviceGroupedByCountry ?? null;
  }

  private groupBy(array: any, key: any): Promise<{ [key: string]: Device[] }> {
    this.logger.verbose(`With in groupBy`);
    return array.reduce((result: any, currentValue: any) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(
        currentValue,
      );

      return result;
    }, {});
  }
  public async findByIds(ids: number[]): Promise<Device[]> {
    this.logger.verbose(`With in findByIds`);
    const result = await this.repository.findByIds(ids);
    delete result['organization'];
    return result;
  }

  public async findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation(
    ids: number[],
  ): Promise<Device[]> {
    this.logger.verbose(
      `With in findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation`,
    );
    const result = await this.repository.find({
      where: {
        id: In(ids),
      },
    });
    delete result['organization'];
    return result;
  }

  async findOne(
    id: number,
    options?: FindOneOptions<Device>,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findOne`);
    const device: Device = await this.repository.findOne({
      where: {
        id: id,
        ...options,
      },
    });
    if (!device) {
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(
      device.createdAt,
      device,
    );

    delete device['organization'];
    return device;
  }

  async findReads(meterId: string): Promise<Device | null> {
    this.logger.verbose(`With in findReads`);
    const result = await this.repository.findOne({
      where: { externalId: meterId },
    });
    result.timezone = await getLocalTimeZoneFromDevice(
      result.createdAt,
      result,
    );
    delete result['organization'];

    return result ?? null;
  }

  async findDeviceByDeveloperExternalId(
    meterId: string,
    organizationId: number,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findDeviceByDeveloperExternalId`);
    const device: Device = await this.repository.findOne({
      where: {
        developerExternalId: meterId,
        organizationId: organizationId,
      },
    });
    if (!device) {
      this.logger.warn(`Returning null`);
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(
      device.createdAt,
      device,
    );
    return device;
  }

  async findDeviceByDeveloperExternalIByApiUser(
    meterId: string,
    api_user_id: string,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findDeviceByDeveloperExternalIByApiUser`);
    const device: Device = await this.repository.findOne({
      where: {
        developerExternalId: meterId,
        api_user_id: api_user_id,
      },
    });
    if (!device) {
      this.logger.warn(`Returning null`);
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(
      device.createdAt,
      device,
    );
    return device;
  }

  async findMultipleDevicesBasedExternalId(
    meterIdList: Array<string>,
    organizationId: number,
  ): Promise<Array<DeviceDTO | null>> {
    this.logger.verbose(`With in findMultipleDevicesBasedExternalId`);
    return (
      (await this.repository.find({
        where: {
          developerExternalId: In(meterIdList),
          organizationId: organizationId,
        },
      })) ?? null
    );
  }

  async syncDeviceStatusesWithEvident(): Promise<void> {
    const devices = await this.repository.find({
      where: { status: DeviceStatus.Submitted },
    });

    for (const device of devices) {
      try {
        const updatedStatus = await this.evidentService.getDeviceStatus(device.id);

        if (updatedStatus && updatedStatus !== device.status) {
          this.logger.log(`Updating device ${device.id} status: ${device.status} → ${updatedStatus}`);
          device.status = updatedStatus;
          await this.repository.save(device);
        }
      } catch (error) {
        this.logger.warn(`Error syncing device ${device.id}: ${error.message}`);
      }
    }
  }
  public async seed(
    orgCode: number,
    newDevice: NewDeviceDTO,
  ): Promise<Device['id']> {
    this.logger.verbose(`With in seed`);
    const storedDevice = await this.repository.save({
      ...newDevice,
      organizationId: orgCode,
    });

    return storedDevice.id;
  }

  public async register(
    orgCode: number,
    newDevice: NewDeviceDTO,
    files: {
      [DocumentType.FORM_SF_02]: Express.Multer.File[];
      [DocumentType.SF_02C]: Express.Multer.File[];
      [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
      [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
      [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
    },
    api_user_id?: string,
    role?: Role,
  ): Promise<Device> {
    this.logger.verbose(`Within register`);

    if (newDevice && newDevice.countryCode) {
      newDevice.countryCode = newDevice.countryCode.toUpperCase();
    } else {
      this.logger.error('Country code is undefined or missing');
      throw new BadRequestException('Country code is required');
    }

    const sdgBenefitList = SDGBenefits;

    const checkExternalId = await this.repository.findOne({
      where: {
        developerExternalId: newDevice.externalId,
        organizationId: orgCode,
      },
    });

    if (checkExternalId) {
      this.logger.debug('Line No: 236');
      this.logger.error(
        `ExternalId already exists in this organization, can't add entry with same external id ${newDevice.externalId}`,
      );
      throw new ConflictException({
        success: false,
        message: `ExternalId already exists in this organization, can't add entry with same external id ${newDevice.externalId}`,
      });
    }

    newDevice.developerExternalId = newDevice.externalId;
    newDevice.externalId = uuid();

    if (
      newDevice.SDGBenefits &&
      (newDevice.SDGBenefits.includes('0') ||
        newDevice.SDGBenefits.includes('1'))
    ) {
      newDevice.SDGBenefits = [];
    } else if (Array.isArray(newDevice.SDGBenefits)) {
      newDevice.SDGBenefits.forEach((sdbBenefitName: string, index: number) => {
        const foundEle = sdgBenefitList.find(
          (ele) =>
            ele.name.toLowerCase() === sdbBenefitName.toString().toLowerCase(),
        );
        newDevice.SDGBenefits[index] = foundEle ? foundEle.value : 'invalid';
      });

      newDevice.SDGBenefits = newDevice.SDGBenefits.filter(
        (ele) => ele !== 'invalid',
      );
    } else {
      newDevice.SDGBenefits = [];
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const fingerprint = generateDeviceFingerprint({
      latitude: newDevice.latitude,
      longitude: newDevice.longitude,
      commissioningDate: newDevice.commissioningDate,
      capacity: newDevice.capacity,
      fuelCode: newDevice.fuelCode,
      deviceTypeCode: newDevice.deviceTypeCode,
    });

    const fingerprintExists = await this.repository.findOne({
      where: {
        fingerprint: fingerprint,
      },
    });

    if (fingerprintExists) {
      throw new ConflictException({
        message: 'There is a device with matching details',
        statusCode: 409,
      });
    }
    newDevice.fingerprint = fingerprint;

    let result: any;
    if (role === Role.ApiUser) {
      const org = await this.organizationService.findOne(orgCode, {
        api_user_id: api_user_id,
      } as FindOneOptions<Organization>);

      const orgUser = await this.userService.findByEmail(org.orgEmail);

      if (orgUser.role !== Role.OrganizationAdmin) {
        this.logger.error(`Unauthorized`);
        throw new UnauthorizedException({
          success: false,
          message: 'Unauthorized',
        });
      }

      result = await this.repository.save({
        ...newDevice,
        organizationId: orgCode,
        api_user_id: api_user_id,
      });
    } else {
      result = await this.repository.save({
        ...newDevice,
        organizationId: orgCode,
      });
    }
    if (files) {
      const documentTypes = {
        [DocumentType.FORM_SF_02]: DocumentType.FORM_SF_02,
        [DocumentType.SF_02C]: DocumentType.SF_02C,
        [DocumentType.METERING_EVIDENCE]: DocumentType.METERING_EVIDENCE,
        [DocumentType.SINGLE_LINE_DIAGRAM]: DocumentType.SINGLE_LINE_DIAGRAM,
        [DocumentType.PROJECT_PHOTOS]: DocumentType.PROJECT_PHOTOS,
      };

      for (const [field, documentType] of Object.entries(documentTypes)) {
        const deviceId = result.id;
        for (const file of files[field]) {
          try {
            await this.documentsService.upload(
              deviceId,
              DocumentTargetType.DEVICE,
              documentType,
              file,
            );
          } catch (error) {
            this.logger.error(`Failed to upload ${field}: ${error.message}`);
            throw error;
          }
        }
      }
    }
    await queryRunner.commitTransaction();

    result['internalexternalId'] = result.externalId;
    result.externalId = result.developerExternalId;
    delete result['developerExternalId'];
    delete result['organization'];

    return result;
  }

  async update(
    organizationId: number,
    role: Role,
    externalId: string,
    updateDeviceDTO: UpdateDeviceDTO,
  ): Promise<Device> {
    this.logger.verbose(`With in update`);
    const rule = // eslint-disable-line @typescript-eslint/no-unused-vars
      role === Role.DeviceOwner
        ? {
            where: {
              organizationId,
            },
          }
        : undefined;

    let currentDevice = await this.findDeviceByDeveloperExternalId(
      externalId.trim(),
      organizationId,
    );
    if (!currentDevice) {
      this.logger.error(`No device found with id ${externalId}`);
      throw new NotFoundException(`No device found with id ${externalId}`);
    }
    updateDeviceDTO.developerExternalId = updateDeviceDTO.externalId;
    updateDeviceDTO.externalId = currentDevice.externalId;
    const sdgBenefitList = SDGBenefits;

    if (
      updateDeviceDTO.SDGBenefits.includes('0') ||
      updateDeviceDTO.SDGBenefits.includes('1')
    ) {
      updateDeviceDTO.SDGBenefits = [];
    } else if (Array.isArray(updateDeviceDTO.SDGBenefits)) {
      updateDeviceDTO.SDGBenefits.forEach(
        (sdbBenefitName: string, index: number) => {
          const foundEle = sdgBenefitList.find(
            (ele) =>
              ele.name.toLowerCase() ===
              sdbBenefitName.toString().toLowerCase(),
          );
          if (foundEle) {
            updateDeviceDTO.SDGBenefits[index] = foundEle.value;
          } else {
            updateDeviceDTO.SDGBenefits[index] = 'invalid';
          }
        },
      );
      updateDeviceDTO.SDGBenefits = updateDeviceDTO.SDGBenefits.filter(
        (ele) => ele !== 'invalid',
      );
    } else {
      updateDeviceDTO.SDGBenefits = [];
    }
    const fingerprint = generateDeviceFingerprint({
      latitude: updateDeviceDTO.latitude,
      longitude: updateDeviceDTO.longitude,
      commissioningDate: updateDeviceDTO.commissioningDate,
      capacity: updateDeviceDTO.capacity,
      fuelCode: updateDeviceDTO.fuelCode,
      deviceTypeCode: updateDeviceDTO.deviceTypeCode,
    });

    const fingerprintExists = await this.repository.findOne({
      where: {
        fingerprint: fingerprint,
        externalId: Not(updateDeviceDTO.externalId),
      },
    });

    if (fingerprintExists) {
      throw new ConflictException({
        message: 'There is a device with matching details',
        statusCode: 409,
      });
    }
    updateDeviceDTO.fingerprint = fingerprint;

    currentDevice = defaults(updateDeviceDTO, currentDevice);
    const result = await this.repository.save(currentDevice);
    result['internalexternalId'] = result.externalId;
    result.externalId = result.developerExternalId;
    delete result['developerExternalId'];
    delete result['organization'];
    return result;
  }

  async findUngrouped(
    organizationId: number,
    orderFilterDto: DeviceGroupByDTO,
  ): Promise<GroupedDevicesDTO[]> {
    this.logger.verbose(`With in findUngrouped`);
    const devices = await this.repository.find({
      where: { groupId: null, organizationId },
    });
    delete devices['organization'];
    return this.groupDevices(orderFilterDto, devices);
  }
  async findUngroupedById(id: number): Promise<boolean> {
    this.logger.verbose(`With in findUngroupedById`);
    const devices = await this.repository.find({
      where: { groupId: null, id },
    });
    if (devices) {
      return true;
    }
  }

  getDeviceTypes(): CodeNameDTO[] {
    this.logger.verbose(`With in getDeviceTypes`);
    return IREC_DEVICE_TYPES;
  }

  getFuelTypes(): CodeNameDTO[] {
    this.logger.verbose(`With in getFuelTypes`);
    return IREC_FUEL_TYPES;
  }

  isValidDeviceType(deviceType: string): boolean {
    this.logger.verbose(`With in isValidDeviceType`);
    return !!this.getDeviceTypes().find((device) => device.code === deviceType);
  }

  isValidFuelType(fuelType: string): boolean {
    this.logger.verbose(`With in isValidFuelType`);
    return !!this.getFuelTypes().find((fuel) => fuel.code === fuelType);
  }

  groupDevices(
    orderFilterDto: DeviceGroupByDTO,
    devices: Device[],
  ): GroupedDevicesDTO[] {
    this.logger.verbose(`With in groupDevices`);
    const { orderBy } = orderFilterDto;
    const orderByRules: DeviceOrderBy[] = Array.isArray(orderBy)
      ? orderBy
      : [orderBy];
    const groupedDevicesByProps: DeviceDTO[][] = groupByProps(
      devices,
      (item) => {
        return [
          ...orderByRules.map((order: DeviceOrderBy) => {
            if (DeviceSortPropertyMapper[order]) {
              const deviceKey: DeviceKey = DeviceSortPropertyMapper[
                order
              ] as DeviceKey;
              return item[deviceKey];
            }
          }),
        ];
      },
    );
    return groupedDevicesByProps.map((devices: DeviceDTO[]) => {
      return {
        name: this.getDeviceGroupNameFromGroupedDevices(devices, orderByRules),
        devices: devices.map(
          (device: UngroupedDeviceDTO): UngroupedDeviceDTO => {
            return {
              ...device,
              commissioningDateRange: getDateRangeFromYear(
                device.commissioningDate,
              ),
              capacityRange: getCapacityRange(device.capacity),
              selected: true,
            };
          },
        ),
      };
    });
  }

  private getDeviceGroupNameFromGroupedDevices(
    devices: DeviceDTO[],
    orderByRules: DeviceOrderBy[],
  ): string {
    this.logger.verbose(`With in getDeviceGroupNameFromGroupedDevices`);
    return `${orderByRules.map((orderRule: DeviceOrderBy) => {
      const deviceKey: DeviceKey = DeviceSortPropertyMapper[
        orderRule
      ] as DeviceKey;
      if (deviceKey === 'fuelCode') {
        return getFuelNameFromCode(devices[0][deviceKey]);
      }
      if (deviceKey === 'deviceTypeCode') {
        return getDeviceTypeFromCode(devices[0][deviceKey]);
      }
      return devices[0][deviceKey];
    })}`;
  }

  public getFilteredQuery(
    filter: FilterDTO,
    orgId?: number,
  ): FindManyOptions<Device> {
    this.logger.verbose(`With in getFilteredQuery`);
    const where: FindConditions<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
      capacity: filter.capacity && LessThanOrEqual(filter.capacity),
      gridInterconnection: filter.gridInterconnection,
      countryCode: filter.country && getCodeFromCountry(filter.country),
    });
    if (orgId != null || orgId != undefined) {
      where.organizationId = orgId;
    } else if (
      filter.organizationId != null &&
      filter.organizationId != undefined
    ) {
      where.organizationId = filter.organizationId;
    }
    if (filter.start_date != null && filter.end_date === undefined) {
      where.commissioningDate = MoreThanOrEqual(filter.start_date);
    }
    if (filter.start_date === undefined && filter.end_date != null) {
      where.commissioningDate = LessThanOrEqual(filter.end_date);
    }
    if (filter.start_date != null && filter.end_date != null) {
      where.commissioningDate =
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date);
    }
    if (filter.SDGBenefits) {
      const newsdg = filter.SDGBenefits.toString();
      const sdgBenefitsArray = newsdg.split(',');
      where.SDGBenefits = Raw(
        (alias) =>
          `${alias} ILIKE ANY(ARRAY[${sdgBenefitsArray.map((term) => `'%${term}%'`)}])`,
      );
    }
    if (filter.deviceTypeCode) {
      const newDeviceType = filter.deviceTypeCode.toString();
      const newDTypeArray = newDeviceType.split(',');
      where.deviceTypeCode = Raw(
        (alias) =>
          `${alias} ILIKE ANY(ARRAY[${newDTypeArray.map((term) => `'%${term}%'`)}])`,
      );
    }
    if (filter.offTaker) {
      const newOffTaker = filter.offTaker.toString();
      const newOffTakerArray = newOffTaker.split(',');
      where.offTaker = Raw(
        (alias) =>
          `${alias} ILIKE ANY(ARRAY[${newOffTakerArray.map((term) => `'%${term}%'`)}])`,
      );
    }
    return {
      where,
      order: {
        organizationId: 'DESC',
      },
    };
  }
  private getRawFilter(filter: string): FindOperator<any> {
    this.logger.verbose(`With in getRawFilter`);
    return Raw((alias) => `${alias} = Any(SDGBenefits)`, {
      SDGBenefits: [filter],
    });
  }
  public async addGroupIdToDeviceForReserving(
    currentDevice: Device,
    groupId: number,
  ): Promise<Device> {
    this.logger.verbose(`With in addGroupIdToDeviceForReserving`);
    currentDevice.groupId = groupId;
    return await this.repository.save(currentDevice);
  }

  public async addToGroup(
    currentDevice: Device,
    groupId: number,
    organizationOwnerCode?: number,
  ): Promise<Device> {
    this.logger.verbose(`With in addToGroup`);
    const deviceExists = await this.getDeviceForGroup(
      currentDevice.id,
      groupId,
    );
    if (deviceExists) {
      const message = `Device with id: ${currentDevice.id} already added to this group`;
      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
    if (currentDevice.groupId) {
      const message = `Device with id: ${currentDevice.id} already belongs to a group`;
      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
    if (
      organizationOwnerCode &&
      currentDevice.organizationId !== organizationOwnerCode
    ) {
      this.logger.error(
        `Device with id: ${currentDevice.id} belongs to a different owner`,
      );
      throw new NotAcceptableException(
        `Device with id: ${currentDevice.id} belongs to a different owner`,
      );
    }
    currentDevice.groupId = groupId;
    return await this.repository.save(currentDevice);
  }

  public async removeFromGroup(
    deviceId: number,
    groupId: number,
  ): Promise<Device> {
    this.logger.verbose(`With in removeFromGroup`);
    const currentDevice = await this.getDeviceForGroup(deviceId, groupId);
    if (!currentDevice) {
      this.logger.error(
        `in removeFromGroup 373 No device found with id ${deviceId} and groupId: ${groupId}`,
      );
    }
    currentDevice ? (currentDevice.groupId = null) : '';

    return await this.repository.save(currentDevice);
  }

  private async getDeviceForGroup(
    deviceId: number,
    groupId: number,
  ): Promise<Device | undefined> {
    this.logger.verbose(`With in getDeviceForGroup`);
    return this.repository.findOne({
      where: {
        id: deviceId,
        groupId,
      },
    });
  }
  public async updateReadType(
    deviceId: string,
    meterReadType: string,
  ): Promise<Device> {
    this.logger.verbose(`With in updatereadtype`);
    const deviceReadType = await this.repository.findOne({
      where: {
        externalId: deviceId,
      },
    });
    if (!deviceReadType) {
      this.logger.error(`No device found with id ${deviceId}`);
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    deviceReadType.meterReadtype = meterReadType;

    return await this.repository.save(deviceReadType);
  }
  public async updateTimezone(
    deviceId: string,
    timeZone: string,
  ): Promise<Device> {
    this.logger.verbose(`With in updatetimezone`);
    const deviceReadType = await this.repository.findOne({
      where: {
        externalId: deviceId,
      },
    });
    if (!deviceReadType) {
      this.logger.error(`No device found with id ${deviceId}`);
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    deviceReadType.timezone = timeZone;

    return await this.repository.save(deviceReadType);
  }

  private getBuyerFilteredQuery(
    filter: FilterDTO,
    pageNumber,
    limit,
  ): FindManyOptions<Device> {
    this.logger.verbose(`With in getBuyerFilteredQuery`);
    const where: FindConditions<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
      deviceTypeCode: filter.deviceTypeCode,
      capacity: filter.capacity && LessThanOrEqual(filter.capacity),
      offTaker: filter.offTaker,
      countryCode: filter.country && getCodeFromCountry(filter.country),
      commissioningDate:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),
    });
    return {
      where,
      order: {
        organizationId: 'ASC',
      },
      skip: (pageNumber - 1) * limit,
      take: limit,
    };
  }
  public async findDeviceForBuyer(
    filterDto: FilterDTO,
    pageNumber: number,
    api_user_id: string,
  ): Promise<any> {
    const limit = 20;
    let query = this.getFilteredQuery(filterDto);
    if (pageNumber) {
      query = {
        ...query,
        skip: (pageNumber - 1) * limit,
        take: limit,
      };
    }
    let where: any = query.where;

    where = { ...where, groupId: null, api_user_id: api_user_id };

    query.where = where;

    const [devices, totalCount] = await this.repository.findAndCount(query);

    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = pageNumber;

    const newUnreservedDevices = devices.map((device: Device) => {
      delete device['organization'];
      return device;
    });
    return {
      devices: newUnreservedDevices,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  public async addCertificateIssueDateLogForDevice(
    params: CheckCertificateIssueDateLogForDeviceEntity,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in AddCertificateIssueDateLogForDevice`);
    return await this.checkDeviceLogCertificateRepository.save({
      ...params,
    });
  }
  //add new fuction for add window cycle date for late certificate
  public async addLateCertificateIssueDateLogForDevice(
    params: DeviceLateOngoingIssueCertificateEntity,
  ): Promise<DeviceLateOngoingIssueCertificateEntity> {
    this.logger.verbose(`With in AddLateCertificateIssueDateForDevice`);
    return await this.lateDeviceCertificateRepository.save({
      ...params,
    });
  }

  public async findAllLateCycle(
    groupId?: number,
  ): Promise<DeviceLateOngoingIssueCertificateEntity[]> {
    this.logger.verbose(`With in DeviceLateOngoingIssueCertificateList`);
    const whereClause: any = {
      certificate_issued: false,
      archived_at: null,
    };
    if (groupId) {
      whereClause.groupId = groupId; // Add groupId condition if provided
      this.logger.debug(`filtering by groupId: ${groupId}`);
    }
    return await this.lateDeviceCertificateRepository.find({
      where: whereClause,
      order: {
        late_end_date: 'ASC',
      },
    });
  }

  public async findOneLateCycle(
    groupId: number,
    externalId: string,
  ): Promise<DeviceLateOngoingIssueCertificateEntity[]> {
    return await this.lateDeviceCertificateRepository.find({
      where: {
        groupId: groupId,
        device_externalid: externalId,
        //createdAt:LessThanOrEqual(reservation_end_UtcDate)
      },
      order: {
        id: 'ASC',
      },
      take: 1,
    });
  }
  public async getCheckCertificateIssueDateLogForDevice(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getCheckCertificateIssueDateLogForDevice`);
    const query = this.getDeviceLogFilteredQuery(deviceid, startDate, endDate);
    try {
      const device = await query.getRawMany();
      return device.map((s: any) => {
        const item: any = {
          certificate_issuance_startdate:
            s.device_certificate_issuance_startdate,
          certificate_issuance_enddate: s.device_certificate_issuance_enddate,
          readvalue_watthour: s.device_readvalue_watthour,
          status: s.device_status,
          deviceid: s.device_externalId,
        };
        return item;
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve users`, error.stack);
    }
  }

  private getDeviceLogFilteredQuery(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in getDeviceLogFilteredQuery`);
    //  const { organizationName, status } = filterDto;
    return this.checkDeviceLogCertificateRepository
      .createQueryBuilder('device')
      .where('device.externalId = :deviceid', { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where("device.status ='Requested' OR device.status ='Succeeded'");
        }),
      )
      .andWhere(
        new Brackets((db) => {
          db.where(
            'device.certificate_issuance_startdate BETWEEN :startDateFirstWhere AND :endDateFirstWhere ',
            { startDateFirstWhere: startDate, endDateFirstWhere: endDate },
          )
            .orWhere(
              'device.certificate_issuance_enddate BETWEEN :startDateSecondtWhere AND :endDateSecondWhere',
              { startDateSecondtWhere: startDate, endDateSecondWhere: endDate },
            )
            .orWhere(
              ':startdateThirdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate',
              { startdateThirdWhere: startDate },
            )
            .orWhere(
              ':enddateforthdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate',
              { enddateforthdWhere: endDate },
            );
        }),
      );
  }

  async getAllRead(
    meterId: string,
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    this.logger.verbose(`With in getallread`);
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: 0)
      |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")`;
    return await this.execute(fluxQuery);
  }
  async execute(query: string | any): Promise<any> {
    this.logger.verbose(`With in execute`);
    const data = await this.dbReader.collectRows(query);
    return data.map((record: any) => ({
      timestamp: new Date(record._time),
      value: Number(record._value),
    }));
  }
  get dbReader(): any {
    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;

    return new InfluxDB({ url, token }).getQueryApi(org);
  }

  async getOrganizationDevicesTotal(organizationId: number): Promise<Device[]> {
    this.logger.verbose(`With in getOrganizationDevicesTotal`);
    const devices = await this.repository.find({
      where: { organizationId },
    });
    const totalAmountOfReads = [];
    await Promise.all(
      devices.map(async (device: Device) => {
        const certifiedAmountOfRead =
          await this.checkDeviceLogCertificateRepository.find({
            where: { externalId: device.externalId },
          });
        const totalCertifiedReadValue = certifiedAmountOfRead.reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.readvalue_watthour,
          0,
        );
        const totalAmount = await this.getAllRead(device.externalId);
        const totalReadValue = totalAmount.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
        totalAmountOfReads.push({
          externalId: device.developerExternalId,
          totalcertifiedReadValue: totalCertifiedReadValue,
          totalReadValue: totalReadValue,
        });
      }),
    );
    return totalAmountOfReads;
  }

  public async changeDeviceCreatedAt(
    externalId: string,
    onboardedDate: Date,
    givenDate: string,
  ): Promise<string> {
    this.logger.verbose(`With in changeDeviceCreatedAt`);
    const numberOfHistoryReads: number =
      await this.getNumberOfHistoryReads(externalId);
    const numberOfOngReads: number = await this.getNumberOfOngoingReads(
      externalId,
      onboardedDate,
    );

    if (numberOfHistoryReads <= 0 && numberOfOngReads <= 0) {
      return this.changeCreatedAtDate(onboardedDate, givenDate, externalId);
    } else {
      this.logger.error(
        `The given device already had some meter reads;Thus you cannot change the createdAt`,
      );
      throw new HttpException(
        'The given device already had some meter reads;Thus you cannot change the createdAt',
        409,
      );
    }
  }

  async getNumberOfHistoryReads(deviceId: string): Promise<number> {
    this.logger.verbose(`With in getNumberOfHistReads`);
    const query = this.historyRepository
      .createQueryBuilder('devicehistory')
      .where('devicehistory.externalId = :deviceId', { deviceId });
    return await query.getCount();
  }

  async getNumberOfOngoingReads(
    externalId: string,
    onboardedDate: Date,
  ): Promise<number> {
    this.logger.verbose(`With in getNumberOfOngReads`);
    new Date();
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: ${onboardedDate})
      |> filter(fn: (r) => r._measurement == "read"and r.meter == "${externalId}")
      |> count()`;
    return await this.ongExecute(fluxQuery);
  }

  async ongExecute(query: string | any): Promise<number> {
    this.logger.verbose(`With in ongExecute`);
    const data: any = await this.dbReader.collectRows(query);

    if (typeof data[0] === 'undefined' || data.length == 0) {
      return 0;
    }
    return Number(data[0]._value);
  }

  async changeCreatedAtDate(
    onboardedDate: Date,
    givenDate: string,
    externalId: string,
  ): Promise<string> {
    this.logger.verbose(`With in changecreatedAtDate`);
    this.logger.debug('THE EXTERNALID IS::::::::::::::::::::::::' + externalId);
    const sixMonthsAgo = new Date(onboardedDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (
      new Date(givenDate) < sixMonthsAgo ||
      new Date(givenDate) >= new Date(onboardedDate)
    ) {
      this.logger.error(
        `Given date is more than 6 months before the onboarded date or after or equal to the onboarded date`,
      );
      throw new HttpException(
        'Given date is more than 6 months before the onboarded date or after or equal to the onboarded date',
        400,
      );
    }

    await this.repository.update(
      { createdAt: onboardedDate, externalId: externalId },
      { createdAt: givenDate },
    );
    this.logger.log(
      `Changed createdAt date from ${onboardedDate} to ${givenDate}`,
    );
    return `Changed createdAt date from ${onboardedDate} to ${givenDate}`;
  }

  public async atto(
    organizationId: number,
    externalId: string,
  ): Promise<any[]> {
    this.logger.verbose(`With in atto`);
    const queryBuilder = this.repository.createQueryBuilder('Device');
    const rows = await queryBuilder
      .where('Device.organizationId = :organizationId', { organizationId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('Device.developerExternalId = :externalId', {
            externalId,
          }).orWhere('Device.developerExternalId LIKE :pattern', {
            pattern: `${externalId}%`,
          });
        }),
      )
      .orderBy('Device.externalId')
      .getMany();
    this.logger.debug(rows);
    const newDevices = [];
    await rows.map((device: Device) => {
      device.externalId = device.developerExternalId;
      delete device['developerExternalId'];
      newDevices.push(device);
    });
    return newDevices;
  }
  async getLastCertifiedDevicelogByGroupId(
    groupId: number,
    deviceId: string,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getLastCertifiedDevicelogBYgroupId`);
    return await this.checkDeviceLogCertificateRepository.find({
      where: {
        groupId: groupId,
        externalId: deviceId,
      },
      order: {
        certificate_issuance_enddate: 'DESC',
      },
    });
  }
  async getCertifiedDeviceDateRange(
    groupId: number,
    device?: DeviceDTO,
  ): Promise<any> {
    this.logger.verbose(`With in getcertifieddevicedaterange`);

    const queryBuilder = this.checkDeviceLogCertificateRepository
      .createQueryBuilder('deviceData')
      .select(
        'MIN(deviceData.certificate_issuance_startdate)',
        'firstcertifiedstartdate',
      )
      .addSelect(
        'MAX(deviceData.certificate_issuance_enddate)',
        'lastcertifiedenddate',
      )
      .leftJoin(Device, 'd', 'deviceData.externalId = d.externalId')
      .where('deviceData.externalId= :externalId', {
        externalId: device.externalId,
      })
      .andWhere('deviceData.groupId= :groupId', { groupId });
    const result = await queryBuilder.getRawOne();
    return { ...result, extenalId: device.developerExternalId };
  }
  async getCertifiedDeviceDateRangeByGroupId(
    groupId: number,
    pageNumber?: number,
  ): Promise<any> {
    this.logger.verbose(`With in getcertifieddevicedaterangeBygroupid`);
    if (pageNumber === undefined || pageNumber === null) {
      pageNumber = 1;
    }
    const pageSize = 10;
    const skip: number = (pageNumber - 1) * pageSize;

    const queryBuilder = await this.checkDeviceLogCertificateRepository
      .createQueryBuilder('deviceData')
      .leftJoin('device', 'd', 'deviceData.externalId = d.externalId')
      .select([
        'd.developerExternalId AS "externalId"',
        'MIN(deviceData.certificate_issuance_startdate) AS firstcertifiedstartdate',
        'MAX(deviceData.certificate_issuance_enddate) AS lastcertifiedenddate',
      ])
      .where('deviceData.groupId = :groupId', { groupId })
      .groupBy('d.developerExternalId')
      .offset(skip)
      .limit(pageSize);
    const result = await queryBuilder.getRawMany();
    const count = await queryBuilder.getCount();
    const totalPages = Math.ceil(count / pageSize);

    return {
      certifieddevices_startToend: result,
      totalItems: count,
      currentPage: pageNumber,
      totalPages: totalPages,
    };
  }

  async remove(
    id: number,
    filterOptions: { groupId: number; organizationId?: number },
  ): Promise<any> {
    this.logger.verbose(`With in remove`);
    const checkDeviceUnreserve = await this.findOne(
      id,
      filterOptions as FindOneOptions<Device>,
    );
    if (!checkDeviceUnreserve) {
      const message = `Device id: ${checkDeviceUnreserve.developerExternalId} already part of the reservation , you cannot delete it`;
      this.logger.error(message);
      return {
        success: false,
        message,
      };
    }
    const certifiedAmountOfRead =
      await this.checkDeviceLogCertificateRepository.findOne({
        where: { externalId: checkDeviceUnreserve.externalId },
      });

    if (certifiedAmountOfRead) {
      const message = `Device id: ${checkDeviceUnreserve.developerExternalId} already certified in reservation , you cannot delete it`;
      this.logger.error(message);
      return {
        success: false,
        message,
      };
    }
    await this.repository.delete(id);
    this.logger.log(`device deleted Successfully`);
    return {
      success: true,
      message: 'device deleted Successfully',
    };
  }
  async updateLateCycleCheckedAt(groupId: number): Promise<any> {
    await this.lateDeviceCertificateRepository.update(
      { groupId: groupId, certificate_issued: false },
      { checked_at: new Date() },
    );
  }
  async updateLateOngoing(
    externalId: string,
    id: number,
    lateend_date?: string,
  ): Promise<any> {
    this.logger.verbose(`With in updatelateongoing`);
    this.logger.verbose(`With in updatelateongoing`, id);
    return await this.lateDeviceCertificateRepository.update(
      { id: id, device_externalid: externalId },
      { late_end_date: lateend_date, certificate_issued: true },
    );
  }
  async updateLateOngoingIfReservationInactive(
    externalId: string,
  ): Promise<any> {
    this.logger.verbose(`With in updatelateongoingIfReservationInactive`);
    this.logger.verbose(
      `With in updatelateongoingIfReservationInactive`,
      externalId,
    );
    return await this.lateDeviceCertificateRepository.update(
      { device_externalid: externalId },
      { certificate_issued: true },
    );
  }

  async archiveLateOngoing(id: number): Promise<any> {
    this.logger.verbose(`With in archiveLateOngoing`);
    this.logger.verbose(`With in archiveLateOngoing`, id);
    return await this.lateDeviceCertificateRepository.update(
      { id: id },
      { archived_at: new Date() },
    );
  }

  async archiveLateOngoingIfReservationInactive(groupId: number): Promise<any> {
    this.logger.verbose(`With in archiveLateOngoingIfReservationInactive`);
    this.logger.verbose(
      `With in archiveLateOngoingIfReservationInactive`,
      groupId,
    );
    return await this.lateDeviceCertificateRepository.update(
      { groupId: groupId, certificate_issued: false },
      { archived_at: new Date() },
    );
  }

  /**
   * Finds a late device certificate cycle for a specific date range
   *
   * @param groupId - The ID of the device group
   * @param deviceExternalId - The external ID of the device
   * @param cycleStartDate - The start date of the cycle period
   * @param cycleEndDate - The end date of the cycle period
   * @returns Promise resolving to the matching cycle entity or undefined if not found
   */
  public async findLateCycleByDateRange(
    groupId: number,
    deviceExternalId: string,
    cycleStartDate: DateTime,
    cycleEndDate: DateTime,
  ): Promise<DeviceLateOngoingIssueCertificateEntity | undefined> {
    return this.lateDeviceCertificateRepository.findOne({
      where: {
        groupId: groupId,
        device_externalid: deviceExternalId,
        late_start_date: cycleStartDate.toString(),
        late_end_date: cycleEndDate.toString(),
      },
    });
  }

  /**
   * Finds an existing device cycle by date range or creates a new one if none exists
   *
   * @param groupId - The ID of the device group
   * @param deviceExternalId - The external ID of the device
   * @param startDate - The start date of the cycle period
   * @param endDate - The end date of the cycle period
   * @returns Promise resolving to the existing or newly created cycle entity
   */
  public async findOrCreateCycle(
    groupId: number,
    deviceExternalId: string,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<DeviceLateOngoingIssueCertificateEntity> {
    // Search for an existing cycle with these parameters
    const existingCycle = await this.findLateCycleByDateRange(
      groupId,
      deviceExternalId,
      startDate,
      endDate,
    );

    // Return existing cycle if found
    if (existingCycle) {
      return existingCycle;
    }

    // Create and return a new cycle
    return this.addCycle(groupId, deviceExternalId, startDate, endDate);
  }

  /**
   * Adds a new late ongoing certificate issuance cycle for a device
   *
   * @param groupId - The ID of the device group
   * @param deviceExternalId - The external ID of the device
   * @param lateStartDate - The start date for the late issuance cycle
   * @param lateEndDate - The end date for the late issuance cycle
   * @returns Promise resolving to the created certificate cycle entity
   */
  public async addCycle(
    groupId: number,
    deviceExternalId: string,
    lateStartDate: Date | string | DateTime,
    lateEndDate: Date | string | DateTime,
  ): Promise<DeviceLateOngoingIssueCertificateEntity> {
    this.logger.debug(
      `Creating late cycle for device: ${deviceExternalId}, group: ${groupId}`,
    );

    // Create and populate the entity
    const cycleEntity = new DeviceLateOngoingIssueCertificateEntity();
    cycleEntity.device_externalid = deviceExternalId;
    cycleEntity.groupId = groupId;
    cycleEntity.late_start_date = lateStartDate.toString();
    cycleEntity.late_end_date = lateEndDate.toString();

    // Persist the entity
    const savedEntity =
      await this.addLateCertificateIssueDateLogForDevice(cycleEntity);

    this.logger.debug(
      `Created late cycle ID: ${savedEntity.id} for device: ${deviceExternalId}`,
    );
    return savedEntity;
  }

  /**
   * Checks for and fills any missing cycles for a device
   *
   * @param group - The device group
   * @param device - The device to check for missing cycles
   * @returns Promise resolving when all missing cycles are processed
   */
  public async checkForDeviceMissingCycles(
    group: DeviceGroup,
    device: Device,
  ): Promise<void> {
    // Get cycle boundaries
    const reservationEndDate = new Date(group.reservationEndDate);
    const now = new Date();

    const cycleEnd = reservationEndDate > now ? now : reservationEndDate;

    const deviceCreationDate = new Date(device.createdAt);

    // Iterate through time periods to find and fill gaps
    let currentDate = new Date(deviceCreationDate);

    while (currentDate < cycleEnd) {
      // Calculate the next date based on frequency
      const nextDate = getCycleEndDate(currentDate, group.frequency);

      // Determine the actual end date (earlier of calculated end or boundary end)
      const actualEndDate = nextDate < cycleEnd ? nextDate : cycleEnd;

      // Create cycle if it doesn't exist
      await this.findOrCreateCycle(
        group.id,
        device.externalId,
        DateTime.fromJSDate(currentDate).toUTC(),
        DateTime.fromJSDate(actualEndDate).toUTC(),
      );

      // Move to next period
      currentDate = nextDate;
    }
  }

  /**
   * Retrieves the most recently issued certificate cycles for each unique device-group combination
   *
   * @returns Promise resolving to an array of the latest issued certificate cycles
   */
  async findLatestIssuedCyclesByDeviceAndGroup(): Promise<any> {
    return this.lateDeviceCertificateRepository
      .createQueryBuilder('cycle')
      .distinctOn(['cycle.device_externalid', 'cycle.groupId'])
      .where('cycle.certificate_issued = :issued', { issued: true })
      .andWhere('cycle.archived_at IS NULL')
      .orderBy('cycle.device_externalid', 'ASC')
      .addOrderBy('cycle.groupId', 'ASC')
      .addOrderBy('cycle.late_end_date', 'DESC')
      .getMany();
  }

  /**
   * Archives all outdated certificate cycles for a specific device-group combination
   *
   * @param cycle - The reference cycle used to determine which older cycles to archive
   * @returns Promise resolving when the update operation completes
   */
  async archiveOutdatedLateOngoingCycles(
    cycle: DeviceLateOngoingIssueCertificateEntity,
  ): Promise<any> {
    await this.lateDeviceCertificateRepository.update(
      {
        device_externalid: cycle.device_externalid,
        groupId: cycle.groupId,
        certificate_issued: false,
        late_end_date: LessThanOrEqual(cycle.late_start_date),
        archived_at: null,
      },
      {
        archived_at: new Date(),
      },
    );
  }
}
