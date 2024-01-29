import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
  HttpException,
  HttpStatus,
  HttpService,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOneOptions, Repository, In, IsNull, Not, FindOperator,
  Raw, Brackets, SelectQueryBuilder, FindConditions, FindManyOptions, Between, LessThanOrEqual, MoreThanOrEqual, ILike
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
import { DeviceOrderBy, Integrator, ReadType, Role, IRECDeviceStatus } from '../../utils/enums';
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
import { SDGBenefits } from '../../models/Sdgbenefit'
import { v4 as uuid } from 'uuid';
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { Observable } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { IrecDevicesInformationEntity } from './irec_devices_information.entity'
import { IrecErrorLogInformationEntity } from './irec_error_log_information.entity'
import { getLocalTimeZoneFromDevice } from '../../utils/localTimeDetailsForDevice';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(HistoryIntermediate_MeterRead) private readonly historyrepository: Repository<HistoryIntermediate_MeterRead>,
    @InjectRepository(Device) private readonly repository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly checkdevcielogcertificaterepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    private httpService: HttpService,
    @InjectRepository(IrecDevicesInformationEntity)
    private readonly irecinforepository: Repository<IrecDevicesInformationEntity>,
    @InjectRepository(IrecErrorLogInformationEntity)
    private readonly irecerrorlogrepository: Repository<IrecErrorLogInformationEntity>,
    private readonly organizationService : OrganizationService,
    private readonly userService: UserService,
  ) { }

  public async find(filterDto: FilterDTO, pagenumber: number, OrgId?: number): Promise<{ devices: Device[], currentPage, totalPages, totalCount }> {
    this.logger.verbose(`With in find`);
    const limit = 20;
    let query = await this.getFilteredQuery(filterDto, OrgId)
    if (pagenumber) {
      query = {
        ...query, skip: (pagenumber - 1) * limit,
        take: limit
      }
    }

    const [devices, totalCount] = await this.repository.findAndCount({
      relations: ['organization'],
      ...query
    });
    //  const [devices, totalCount] = await this.repository.findAndCount({relations: ['organization'],query});
    //devices.externalId = devices.developerExternalId
    const totalPages = Math.ceil(totalCount / 20);
    const currentPage = pagenumber;
    const newDevices = [];

    await devices.map((device: Device) => {
      device['organizationname'] = device.organization.name
      // device.externalId = device.developerExternalId
      delete device["organization"];
      newDevices.push(device);
    })

    return {
      devices: newDevices,
      currentPage,
      totalPages,
      totalCount
    };
  }

  public async findForIntegrator(integrator: Integrator): Promise<Device[]> {
    this.logger.verbose(`With in findForIntegrator`);
    const result = this.repository.find({
      where: {
        integrator,
      },
    });
    delete result["organization"];
    return result;
  }

  async getOrganizationDevices(organizationId: number, api_user_id: string, role: Role, filterDto: FilterDTO, pagenumber: number): Promise<any> {
    this.logger.verbose(`With in getOrganizationDevices`);
    if (pagenumber === null || pagenumber === undefined) {
      pagenumber = 1
    }
    if (Object.keys(filterDto).length != 0) {
      const limit = 20;
      const query = await this.getFilteredQuery(filterDto);
      let where: any = query.where;
      if(role == Role.ApiUser) {
       //@ts-ignore
       if(filterDto.organizationId) {
          where = { ...where, organizationId};          
        }
        else {
          where = { ...where, api_user_id };
        }
      }else{
        where = { ...where, organizationId};
      }
 
      query.where = where;
      const [devices, totalCount] = await this.repository.findAndCount({
        ...query, skip: (pagenumber - 1) * limit,
        take: limit,
        order: {
          createdAt: 'DESC',
        }
      });
      const totalPages = Math.ceil(totalCount / limit);
      if (pagenumber > totalPages) {
        this.logger.error(`Page number out of range`);
        throw new HttpException('Page number out of range', HttpStatus.NOT_FOUND);
      }
      const currentPage = pagenumber;
      const newDevices = [];
      await devices.map((device: Device) => {
        device.externalId = device.developerExternalId
        delete device["developerExternalId"];
        delete device["organization"];
 
        newDevices.push(device);
      })
      return {
        devices: newDevices,
        currentPage,
        totalPages,
        totalCount
      };
    }
    //devices.externalId = devices.developerExternalId
    const [devices, totalCount] = await this.repository.findAndCount({
      where: { organizationId },
      order: {
        createdAt: 'DESC',
      },
    });
 
    //devices.externalId = devices.developerExternalId
    const newDevices = [];
    await devices.map((device: Device) => {
      device.externalId = device.developerExternalId
      delete device["developerExternalId"];
      delete device["organization"];
      newDevices.push(device);
    })
 
    return newDevices;
  }


  public getatleastonedeviceinOrg(organizationId: number): Promise<Device[]> {
    this.logger.verbose(`With in getatleastonedeviceinOrg`);
    const result = this.repository.find({
      where: { organizationId },
      order: {
        id: 'DESC',
      },
      take: 1
    });
    delete result["organization"];
    return result;
  }
  // Cron pattern for running every 30 seconds
  // @Cron('*/30 * * * * *') 
  // async fetchDataCronJob() {
  //   try {
  //     const data = await this.fetchDataFromApi();
  //     console.log('Fetched data:', data);
  //   } catch (error) {
  //     console.error('Error fetching data:', error.message);
  //   }
  // }
  // async fetchDataFromApi(): Promise<any> {
  //   console.log("hitting api");
  //   const apiUrl = `${process.env.IREC_EVIDENT_API_URL}/devices/2A70ES100011`;
  //   let jwtToken = await regenerateToken(this.httpService);

  //   const headers = {
  //     // Add your custom headers here
  //     'Authorization': `Bearer ${jwtToken}`
  //   };

  //   const response = await this.httpService.get(apiUrl, { headers }).toPromise();
  //   return response.data;
  // }



  //@Cron('*/30 * * * * *')
  async I_recPostData(deviceId): Promise<any> {
    this.logger.verbose(`With in I_recPostData`);
    const device = await this.repository.findOne({
      where: { id: deviceId, IREC_Status: 'NotRegistered' },
      order: {
        createdAt: 'DESC',
      },
    });

    if (device) {
      let jwtToken = await regenerateToken(this.httpService);
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      };
      if (device.fuelCode === null) {
        this.logger.error(`Device Added Failure in I-REC,Item not found for fuel`);
        return {
          status: false,
          message: 'Device Added Failure in I-REC,Item not found for fuel',

        };
      }
      const requestBody = {
        name: `${device.externalId}`,
        fuel: `/fuels/${device.fuelCode}`
      };
      const config: AxiosRequestConfig = {
        headers,
      };

      const url = `${process.env.IREC_EVIDENT_API_URL}/devices`;
      try {
        const response = await this.httpService.post(url, requestBody, config).toPromise();
        const data = response.data;
        device.IREC_ID = data.code;
        device.IREC_Status = IRECDeviceStatus.DeviceNameCreated;
        await this.repository.save(device);
        let irecdeviceaddDto = new IrecDevicesInformationEntity();
        irecdeviceaddDto.IREC_id = data.code,
          irecdeviceaddDto.event = 'register',
          irecdeviceaddDto.request = requestBody,
          irecdeviceaddDto.responses = data
        await this.irecinforepository.save({
          ...irecdeviceaddDto
        })
        this.logger.log(`Device Added Successfully in I-REC`);
        return {
          status: true,
          message: 'Device Added Successfully in I-REC',
          IREC_ID: data.code
        };

      } catch (error) {
        let irecdeviceerrorlogDto = new IrecErrorLogInformationEntity();

        irecdeviceerrorlogDto.event = 'register',
          irecdeviceerrorlogDto.request = requestBody,
          irecdeviceerrorlogDto.error_log_responses = error
        await this.irecerrorlogrepository.save({
          ...irecdeviceerrorlogDto
        })
        this.logger.error(`Device Added Failure in I-REC ${error}`);
        return {
          status: false,
          message: 'Device Added Failure in I-REC, ' + error,

        };
      }
    }

    //return { status: false, message: 'device not found' };
  }

  //this function for add device details into irec 
  async I_RECDeviceDetailsPostData(deviceId): Promise<Observable<any>> {
    this.logger.verbose(`With in I_RECDeviceDetailsPostData`);
    const device = await this.repository.findOne({
      where: { id: deviceId, IREC_Status: 'DeviceNameCreated' },
      order: {
        createdAt: 'DESC',
      },
    });

    if (device) {
      let jwtToken = await regenerateToken(this.httpService);
      const headers = {
        'Content-Type': 'application/json', // Set the Content-Type header for JSON data
        'Authorization': `Bearer ${jwtToken}`
        // Add any other custom headers if needed
      };
      let irec_capacity = device.capacity / 1000;
      //let deId=device.externalId
      const requestBody = {
        "deviceType": "/device_types/" + device.deviceTypeCode,
        "fuel": "/fuels/",
        "device": "/devices/",
        "registrant": "/registrants/",
        "issuer": "/issuers/",
        "name": device.externalId,
        "capacity": irec_capacity,
        "supported": true,
        "latitude": device.latitude,
        "longitude": device.longitude,
        "registrationDate": device.createdAt,
        "commissioningDate": device.commissioningDate,
        "status": IRECDeviceStatus.Submitted,
        "active": true,
        "address1": device.address,
        "country": "/countries/" + device.countryCode,
      }
      // console.log("jwtToken", jwtToken);

      const config: AxiosRequestConfig = {
        headers, // Set the headers in the config object

      };

      const url = `${process.env.IREC_EVIDENT_API_URL}/devices`;// Replace with your API endpoint

      let data: any;
      let response = this.httpService.post(url, requestBody, config).subscribe(response => {

        data = response.data;
        device.IREC_ID = data.code
        device.IREC_Status = IRECDeviceStatus.DeviceNameCreated

      }, error => {
        this.logger.error(error);

      });
      await this.repository.save(device);
      // console.log("response from irec", response._subscribe)
      return data
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

    delete result["organization"];
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
    delete result["organization"];
    return result;
  }
  public async NewfindForGroup(groupId: number): Promise<{ [key: string]: Device[] }> {
    this.logger.verbose(`With in NewfindForGroup`);
    let groupdevice: Array<any> = await this.repository.find({
      where: { groupId },
      order: {
        createdAt: 'DESC',
      },
    });
    //console.log(groupdevice)

    groupdevice = groupdevice.filter(ele => ele.meterReadtype == ReadType.Delta || ele.meterReadtype == ReadType.ReadMeter)

    const deviceGroupedByCountry = this.groupBy(groupdevice, 'countryCode');
    //console.log(deviceGroupedByCountry);
    return deviceGroupedByCountry;
  }

  private groupBy(array: any, key: any): Promise<{ [key: string]: Device[] }> {
    ////console.log(array)
    this.logger.verbose(`With in groupBy`);
    return array.reduce((result: any, currentValue: any) => {

      (result[currentValue[key]] = result[currentValue[key]] || []).push(
        currentValue
      );

      return result;
    }, {});
  };
  public async findByIds(ids: number[]): Promise<Device[]> {
    this.logger.verbose(`With in findByIds`);
    const result = await this.repository.findByIds(ids);
    delete result["organization"];
    return result;
  }

  public async findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation(ids: number[]): Promise<Device[]> {
    this.logger.verbose(`With in findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation`);
    const result = await this.repository.find({
      where: {
        //id: In(ids), groupId: IsNull()
        id: In(ids)
        //, groupId: IsNull()
      }
    });
    delete result["organization"];
    return result;
  }

  async findOne(
    id: number,
    options?: FindOneOptions<Device>,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findOne`);
    const device: Device = await this.repository.findOne(id, options);
    if (!device) {
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(device.createdAt, device);

    delete device["organization"];
    return device;
  }

  async findReads(meterId: string): Promise<DeviceDTO | null> {
    this.logger.verbose(`With in findReads`);
    const result = await this.repository.findOne({ where: { externalId: meterId } })
    delete result["organization"];

    return (
      (result) ?? null
    );

  }

  async findDeviceByDeveloperExternalId(meterId: string, organizationId: number): Promise<Device | null> {
    this.logger.verbose(`With in findDeviceByDeveloperExternalId`);
    //change whare condition filter by developerExternalId instead of externalId and organizationid
    const device: Device = await this.repository.findOne({
      where: {
        developerExternalId: meterId,
        organizationId: organizationId
      }
    });

    // delete device["organization"];
    if (!device) {
      this.logger.warn(`Returning null`);
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(device.createdAt, device);
    return device;
  }
  async findMultipleDevicesBasedExternalId(
    meterIdList: Array<string>,
    organizationId: number
  ): Promise<Array<DeviceDTO | null>> {
    //console.log("meterIdList", meterIdList);
    this.logger.verbose(`With in findMultipleDevicesBasedExternalId`);
    return (
      (await this.repository.find({
        where: { developerExternalId: In(meterIdList), organizationId: organizationId },
      })) ?? null
    );
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
    api_user_id?: string,
    role?: Role,
  ): Promise<Device> {
    this.logger.verbose(`With in register`);
    //console.log(newDevice);
    const code = newDevice.countryCode.toUpperCase();
    newDevice.countryCode = code;
    let sdgbbenifitslist = SDGBenefits;

    const checkexternalid = await this.repository.findOne({
      where: {
        developerExternalId: newDevice.externalId,
        organizationId: orgCode

      }
    });
    //console.log(checkexternalid)
    if (checkexternalid != undefined) {
      this.logger.debug("Line No: 236");
      this.logger.error(`ExternalId already exist in this organization, can't add entry with same external id ${newDevice.externalId}`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `ExternalId already exist in this organization, can't add entry with same external id ${newDevice.externalId}`,

          })
        );
      });
      // throw new ConflictException({
      //   success: false,
      //   message: `ExternalId already exist in this organization, can't add entry with same external id ${newDevice.externalId}`,
      // })
      // return new NotFoundException(`ExternalId already exist in this organization, can't add entry with same external id ${newDevice.externalId}`);
    }
    newDevice.developerExternalId = newDevice.externalId;
    newDevice.externalId = uuid();
    //console.log(newDevice.developerExternalId)
    //@ts-ignore
    if (newDevice.SDGBenefits === 0 || newDevice.SDGBenefits === 1) {
      newDevice.SDGBenefits = []
    } else if (Array.isArray(newDevice.SDGBenefits)) {
      newDevice.SDGBenefits.forEach(
        (sdgbname: string, index: number) => {
          let foundEle = sdgbbenifitslist.find(ele => ele.name.toLowerCase() === sdgbname.toString().toLowerCase());
          if (foundEle) {
            newDevice.SDGBenefits[index] = foundEle.value
          }
          else {
            newDevice.SDGBenefits[index] = 'invalid';
          }
        });
      newDevice.SDGBenefits = newDevice.SDGBenefits.filter(ele => ele !== 'invalid');
    } else {
      newDevice.SDGBenefits = []
    }
    let result: any;
    if (role === Role.ApiUser) {
      const org = await this.organizationService.findOne(orgCode, {
        where: {
          api_user_id: api_user_id
        }
      });

      const orguser = await this.userService.findByEmail(org.orgEmail);
 
      if(orguser.role != Role.OrganizationAdmin) {
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
    }
    else {
      result = await this.repository.save({
        ...newDevice,
        organizationId: orgCode,
      });
    }
    result.externalId = result.developerExternalId;
    delete result["developerExternalId"];
    delete result["organization"];
    return result
  }
  async update(
    organizationId: number,
    role: Role,
    externalId: string,
    updateDeviceDTO: UpdateDeviceDTO,
  ): Promise<Device> {
    this.logger.verbose(`With in update`);
    const rule =
      role === Role.DeviceOwner
        ? {
          where: {
            organizationId,
          },
        }
        : undefined;
    let currentDevice = await this.findDeviceByDeveloperExternalId(externalId.trim(), organizationId);
    if (!currentDevice) {
      this.logger.error(`No device found with id ${externalId}`);
      throw new NotFoundException(`No device found with id ${externalId}`);
    }
    updateDeviceDTO.developerExternalId = updateDeviceDTO.externalId;
    //console.log(updateDeviceDTO.countryCode);
    // const code = updateDeviceDTO.countryCode.toUpperCase();
    updateDeviceDTO.externalId = currentDevice.externalId;
    let sdgbbenifitslist = SDGBenefits;

    //@ts-ignore
    if (updateDeviceDTO.SDGBenefits === 0 || updateDeviceDTO.SDGBenefits === 1) {
      updateDeviceDTO.SDGBenefits = []
    } else if (Array.isArray(updateDeviceDTO.SDGBenefits)) {
      updateDeviceDTO.SDGBenefits.forEach(
        (sdgbname: string, index: number) => {
          let foundEle = sdgbbenifitslist.find(ele => ele.name.toLowerCase() === sdgbname.toString().toLowerCase());
          if (foundEle) {
            updateDeviceDTO.SDGBenefits[index] = foundEle.value
          }
          else {
            updateDeviceDTO.SDGBenefits[index] = 'invalid';
          }
        });
      updateDeviceDTO.SDGBenefits = updateDeviceDTO.SDGBenefits.filter(ele => ele !== 'invalid');
    } else {
      updateDeviceDTO.SDGBenefits = []
    }
    currentDevice = defaults(updateDeviceDTO, currentDevice);
    // currentDevice.status = DeviceStatus.Submitted;
    const result = await this.repository.save(currentDevice);
    result.externalId = result.developerExternalId;
    delete result["developerExternalId"];
    delete result["organization"];
    //console.log(result);
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
    delete devices["organization"];
    return this.groupDevices(orderFilterDto, devices);
  }
  async findUngroupedById(
    id: number,
    organizationId?: number
  ): Promise<boolean> {
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
              //@ts-ignore
              return item[deviceKey];
            }
          }),
        ];
      },
    );
    const groupedDevices: GroupedDevicesDTO[] = groupedDevicesByProps.map(
      (devices: DeviceDTO[]) => {
        return {
          name: this.getDeviceGroupNameFromGroupedDevices(
            devices,
            orderByRules,
          ),
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
      },
    );
    return groupedDevices;
  }

  private getDeviceGroupNameFromGroupedDevices(
    devices: DeviceDTO[],
    orderByRules: DeviceOrderBy[],
  ): string {
    this.logger.verbose(`With in getDeviceGroupNameFromGroupedDevices`);
    const name = `${orderByRules.map((orderRule: DeviceOrderBy) => {
      const deviceKey: DeviceKey = DeviceSortPropertyMapper[
        orderRule
      ] as DeviceKey;
      if (deviceKey === 'fuelCode') {
        return getFuelNameFromCode(devices[0][deviceKey]);
      }
      if (deviceKey === 'deviceTypeCode') {
        return getDeviceTypeFromCode(devices[0][deviceKey]);
      }
      //@ts-ignore
      return devices[0][deviceKey];
    })}`;
    return name;
  }

  private getFilteredQuery(filter: FilterDTO, orgId?: number): FindManyOptions<Device> {
    this.logger.verbose(`With in getFilteredQuery`);
    const limit = 20;
    const where: FindConditions<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
      // deviceTypeCode: filter.deviceTypeCode,
      capacity: filter.capacity && LessThanOrEqual(filter.capacity),
      gridInterconnection: filter.gridInterconnection,
      // offTaker: filter.offTaker,
      countryCode: filter.country && getCodeFromCountry(filter.country),

    });
    if (orgId != null || orgId != undefined) {
      where.organizationId = orgId
    }
    if (filter.start_date != null && filter.end_date === undefined) {
      where.commissioningDate = MoreThanOrEqual(filter.start_date);

    }
    if (filter.start_date === undefined && filter.end_date != null) {
      where.commissioningDate = LessThanOrEqual(filter.end_date);
    }
    if (filter.start_date != null && filter.end_date != null) {
      where.commissioningDate = filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date)
    }
    if (filter.SDGBenefits) {
      const newsdg = filter.SDGBenefits.toString()
      const sdgBenefitsArray = newsdg.split(',');
      where.SDGBenefits = Raw(alias => `${alias} ILIKE ANY(ARRAY[${sdgBenefitsArray.map(term => `'%${term}%'`)}])`);
      // where.SDGBenefits = this.getRawFilter(filter.SDGBenefits.toString());
    }
    if (filter.deviceTypeCode) {
      const newdtype = filter.deviceTypeCode.toString()
      const newdtypeArray = newdtype.split(',');
      where.deviceTypeCode = Raw(alias => `${alias} ILIKE ANY(ARRAY[${newdtypeArray.map(term => `'%${term}%'`)}])`);

    }
    if (filter.offTaker) {
      const newoffTaker = filter.offTaker.toString()
      const newoffTakerArray = newoffTaker.split(',');
      where.offTaker = Raw(alias => `${alias} ILIKE ANY(ARRAY[${newoffTakerArray.map(term => `'%${term}%'`)}])`);

    }
    //console.log(where)
    const query: FindManyOptions<Device> = {
      where,
      order: {
        organizationId: 'DESC',
      }
    };
    return query;
  }
  private getRawFilter(
    filter:
      | String
    ,
  ): FindOperator<any> {
    this.logger.verbose(`With in getRawFilter`);
    return Raw((alias) => `${alias} = Any(SDGBenefits)`, {
      SDGBenefits: [filter]
    });
  }
  public async addGroupIdToDeviceForReserving(
    currentDevice: Device,
    groupId: number
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
      this.logger.error(`Device with id: ${currentDevice.id} belongs to a different owner`);
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
      // throw new NotFoundException(
      //   `No device found with id ${deviceId} and groupId: ${groupId}`,
      // );
      this.logger.error(`in removeFromGroup 373 No device found with id ${deviceId} and groupId: ${groupId}`);
    }
    currentDevice ? currentDevice.groupId = null : '';

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
  public async updatereadtype(
    deviceId: string,
    meterReadtype: string,
  ): Promise<Device> {
    this.logger.verbose(`With in updatereadtype`);
    const devicereadtype = await this.repository.findOne({
      where: {
        externalId: deviceId,
      }
    });
    if (!devicereadtype) {
      this.logger.error(`No device found with id ${deviceId}`);
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    devicereadtype.meterReadtype = meterReadtype;

    return await this.repository.save(devicereadtype);

  }
  public async updatetimezone(
    deviceId: string,
    timeZone: string,
  ): Promise<Device> {
    this.logger.verbose(`With in updatetimezone`);
    const devicereadtype = await this.repository.findOne({
      where: {
        externalId: deviceId,
      }
    });
    if (!devicereadtype) {
      this.logger.error(`No device found with id ${deviceId}`);
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    devicereadtype.timezone = timeZone;

    return await this.repository.save(devicereadtype);

  }
  //
  private getBuyerFilteredQuery(filter: FilterDTO, pagenumber, limit): FindManyOptions<Device> {
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
    //console.log(where);
    const query: FindManyOptions<Device> = {
      where,
      order: {
        organizationId: 'ASC',
      },
      skip: (pagenumber - 1) * limit,
      take: limit,
    };
    return query;
  }
  public async finddeviceForBuyer(filterDto: FilterDTO, pagenumber: number, api_user_id: string): Promise<any> {
    const limit = 20;
    let query = this.getFilteredQuery(filterDto);
    if (pagenumber) {
      query = {
        ...query, skip: (pagenumber - 1) * limit,
        take: limit
      }
    }
    let where: any = query.where

    where = { ...where, groupId: null, api_user_id: api_user_id };

    query.where = where;

    const [devices, totalCount] = await this.repository.findAndCount(query);

    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = pagenumber;

    const newUnreservedDevices = devices.map((device: Device) => {
      device.externalId = device.developerExternalId;
      delete device["developerExternalId"];
      delete device["organization"];
      return device;
    });
    return {
      devices: newUnreservedDevices,
      currentPage,
      totalPages,
      totalCount
    };
  }


  public async AddCertificateIssueDateLogForDevice(params: CheckCertificateIssueDateLogForDeviceEntity
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in AddCertificateIssueDateLogForDevice`);
    return await this.checkdevcielogcertificaterepository.save({
      ...params,

    });
  }
  // public getCheckCertificateIssueDateLogForDevice(deviceid: string,
  //   startDate: Date,
  //   endDate: Date
  // ): SelectQueryBuilder<CheckCertificateIssueDateLogForDeviceEntity[]> {
  //   // const groupId = await this.checkdevcielogcertificaterepository.find({
  //   //   where: {
  //   //     deviceid: deviceId,
  //   //     certificate_issuance_startdate: startDate && endDate && Between(startDate, endDate),
  //   //     certificate_issuance_enddate: startDate && endDate && Between(startDate, endDate),
  //   //   },
  //   // });
  //   //console.log(deviceid)
  //   const groupId = this.checkdevcielogcertificaterepository
  //     .createQueryBuilder()
  //     .where("deviceid = :deviceid", { deviceid: deviceid })
  //     .andWhere(
  //       new Brackets((db) => {
  //         db.where("certificate_issuance_startdate BETWEEN :startDateFirstWhere AND :endDateFirstWhere ", { startDateFirstWhere: startDate, endDateFirstWhere: endDate })
  //           .orWhere("certificate_issuance_enddate BETWEEN :startDateSecondtWhere AND :endDateSecondWhere", { startDateFirstWhere: startDate, endDateFirstWhere: endDate })
  //           .orWhere(":startdateThirdWhere BETWEEN certificate_issuance_startdate AND certificate_issuance_enddate", { startdateThirdWhere: startDate })
  //           .orWhere(":enddateforthdWhere BETWEEN certificate_issuance_startdate AND certificate_issuance_enddate", { enddateThirdWhere: endDate })

  //       }),
  //     ).getMany();
  //   //console.log(groupId);
  //   return groupId
  // }
  public async getCheckCertificateIssueDateLogForDevice(deviceid: string,
    startDate: Date,
    endDate: Date): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
      this.logger.verbose(`With in getCheckCertificateIssueDateLogForDevice`);
    const query = this.getdevcielogFilteredQuery(deviceid,
      startDate,
      endDate);
    try {

      const device = await query.getRawMany();
      const devices = device.map((s: any) => {
        const item: any = {
          certificate_issuance_startdate: s.device_certificate_issuance_startdate,
          certificate_issuance_enddate: s.device_certificate_issuance_enddate,
          readvalue_watthour: s.device_readvalue_watthour,
          status: s.device_status,
          deviceid: s.device_externalId
        };
        return item;
      });

      return devices;
    } catch (error) {
      this.logger.error(`Failed to retrieve users`, error.stack);
      //  throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  private getdevcielogFilteredQuery(deviceid: string,
    startDate: Date,
    endDate: Date): SelectQueryBuilder<CheckCertificateIssueDateLogForDeviceEntity> {
      this.logger.verbose(`With in getdevcielogFilteredQuery`);
    //  const { organizationName, status } = filterDto;
    const query = this.checkdevcielogcertificaterepository
      .createQueryBuilder("device").
      where("device.externalId = :deviceid", { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where("device.status ='Requested' OR device.status ='Succeeded'")
        }))
      .andWhere(
        new Brackets((db) => {
          db.where("device.certificate_issuance_startdate BETWEEN :startDateFirstWhere AND :endDateFirstWhere ", { startDateFirstWhere: startDate, endDateFirstWhere: endDate })
            .orWhere("device.certificate_issuance_enddate BETWEEN :startDateSecondtWhere AND :endDateSecondWhere", { startDateSecondtWhere: startDate, endDateSecondWhere: endDate })
            .orWhere(":startdateThirdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate", { startdateThirdWhere: startDate })
            .orWhere(":enddateforthdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate", { enddateforthdWhere: endDate })

        }),
      )
    //   //console.log(query)
    // //console.log(query.getQuery())
    return query;
  }

  async getallread(meterId: string,): Promise<Array<{ timestamp: Date, value: number }>> {
    this.logger.verbose(`With in getallread`);
    const fluxQuery =
      `from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: 0)
      |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")`
    return await this.execute(fluxQuery);
  }
  async execute(query: any) {
    this.logger.verbose(`With in execute`);
    const data = await this.dbReader.collectRows(query);
    return data.map((record: any) => ({
      timestamp: new Date(record._time),
      value: Number(record._value),
    }));
  }
  get dbReader() {
    // const url = 'http://localhost:8086';
    // const token = 'admin:admin'
    // const org = '';

    //@ts-ignore
    const url = process.env.INFLUXDB_URL;
    //@ts-ignore
    const token = process.env.INFLUXDB_TOKEN;
    //@ts-ignore
    const org = process.env.INFLUXDB_ORG;

    //@ts-ignore
    return new InfluxDB({ url, token }).getQueryApi(org)
  }

  async getOrganizationDevicesTotal(organizationId: number): Promise<Device[]> {
    this.logger.verbose(`With in getOrganizationDevicesTotal`);
    //console.log(organizationId);
    const devices = await this.repository.find({
      where: { organizationId },
    });
    let totalamountofreads = [];
    await Promise.all(
      devices.map(async (device: Device) => {

        let certifiedamountofread = await this.checkdevcielogcertificaterepository.find(
          {
            where: { externalId: device.externalId }
          }
        )
        const totalcertifiedReadValue = certifiedamountofread.reduce(
          (accumulator, currentValue) => accumulator + currentValue.readvalue_watthour,
          0,
        );
        let totalamount = await this.getallread(device.externalId);
        const totalReadValue = totalamount.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
        totalamountofreads.push({
          externalId: device.developerExternalId,
          totalcertifiedReadValue: totalcertifiedReadValue,
          totalReadValue: totalReadValue
        })

      }))

    //console.log(totalamountofreads);
    return totalamountofreads;
  }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // //@Cron('*/3 * * * *')
  // async updateExternalIdtoDeveloperExternalId() : Promise<void>{
  //   let alldevices:Device[];
  //   alldevices= await this.repository.find();
  //   console.log(alldevices);
  //   await Promise.all(
  //     alldevices.map(async (device: Device) => {
  //       device.developerExternalId = device.externalId;
  //       await this.repository.save(device);

  //     })
  //   );
  // }


  /* */
  public async changeDeviceCreatedAt(externalId, onboardedDate, givenDate) {
    this.logger.verbose(`With in changeDeviceCreatedAt`);
    const numberOfHistReads: number = await this.getNumberOfHistReads(externalId);
    const numberOfOngReads: number = await this.getNumberOfOngReads(externalId, onboardedDate);

    if (numberOfHistReads <= 0 && numberOfOngReads <= 0)
    //no reads exist for the given device
    //So we can change the date
    {
      return this.changecreatedAtDate(onboardedDate, givenDate, externalId);
    }


    else//If reads exist for the given device
    {
      this.logger.error(`The given device already had some meter reads;Thus you cannot change the createdAt`);
      throw new HttpException('The given device already had some meter reads;Thus you cannot change the createdAt', 409);
    }
  }



  async getNumberOfHistReads(deviceId): Promise<number> {
    this.logger.verbose(`With in getNumberOfHistReads`);
    const query = this.historyrepository.createQueryBuilder("devicehistory")
      .where("devicehistory.externalId = :deviceId", { deviceId });
    const count = await query.getCount();
    return count;
  }



  async getNumberOfOngReads(externalId, onboardedDate): Promise<number> {
    this.logger.verbose(`With in getNumberOfOngReads`);
    let fluxQuery = ``;
    const end = new Date();
    fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: ${onboardedDate})
      |> filter(fn: (r) => r._measurement == "read"and r.meter == "${externalId}")
      |> count()`;
    let noOfReads = await this.ongExecute(fluxQuery);

    return noOfReads;
  }


  async ongExecute(query: any) {
    this.logger.verbose(`With in ongExecute`);
    const data: any = await this.dbReader.collectRows(query);

    if (typeof data[0] === 'undefined' || data.length == 0) {
      return 0;
    }
    return Number(data[0]._value);
  }


  async changecreatedAtDate(onboardedDate, givenDate, externalId) {
    this.logger.verbose(`With in changecreatedAtDate`);
    this.logger.debug("THE EXTERNALID IS::::::::::::::::::::::::" + externalId);
    const sixMonthsAgo = new Date(onboardedDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (new Date(givenDate) < sixMonthsAgo || new Date(givenDate) >= new Date(onboardedDate)) {
      this.logger.error(`Given date is more than 6 months before the onboarded date or after or equal to the onboarded date`);
      throw new HttpException('Given date is more than 6 months before the onboarded date or after or equal to the onboarded date', 400);
    }

    await this.repository.update(
      { createdAt: onboardedDate, externalId: externalId },
      { createdAt: givenDate },
    );
    this.logger.log(`Changed createdAt date from ${onboardedDate} to ${givenDate}`);
    return `Changed createdAt date from ${onboardedDate} to ${givenDate}`;
  }
  /* */

  ////////////////////////////////////////

  public async atto(organizationId, externalId) {
    this.logger.verbose(`With in atto`);
    const queryBuilder = this.repository.createQueryBuilder('Device');
    const rows = await queryBuilder
      .where("Device.organizationId = :organizationId", { organizationId })
      .andWhere(
        new Brackets(qb => {
          qb.where("Device.developerExternalId = :externalId", { externalId })
            .orWhere("Device.developerExternalId LIKE :pattern", { pattern: `${externalId}%` });
        }))
      .orderBy('Device.externalId')
      .getMany();
    this.logger.debug(rows);
    const newDevices = [];
    await rows.map((device: Device) => {
      device.externalId = device.developerExternalId
      delete device["developerExternalId"];
      newDevices.push(device);
    })
    return newDevices;
    // rows.map(row => ({
    //   externalId: row.developerExternalId,
    //   organizationId: row.organizationId

    // }));
  }
  async getLastCertifiedDevicelogBYgroupId(
    groupId: number, deviceId: string
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in getLastCertifiedDevicelogBYgroupId`);
    return this.checkdevcielogcertificaterepository.findOne(
      {
        where: {
          groupId: groupId,
          externalId: deviceId,

        },
        order: {
          certificate_issuance_enddate: 'DESC'
        }
      })

  }
  async getcertifieddevicedaterange(groupId, device?): Promise<any> {
    this.logger.verbose(`With in getcertifieddevicedaterange`);
    let queryBuilder;

    queryBuilder = this.checkdevcielogcertificaterepository.createQueryBuilder('deviceData')
      .select('MIN(deviceData.certificate_issuance_startdate)', 'firstcertifiedstartdate')
      .addSelect('MAX(deviceData.certificate_issuance_enddate)', 'lastcertifiedenddate')
      .leftJoin(Device, "d", "deviceData.externalId = d.externalId")
      .where('deviceData.externalId= :externalId', { externalId: device.externalId })
      .andWhere('deviceData.groupId= :groupId', { groupId });
    const result = await queryBuilder.getRawOne();
    let finalresult = { ...result, extenalId: device.developerExternalId }

    return finalresult;





  }
  async getcertifieddevicedaterangeBygroupid(groupId, pageNumber?: number): Promise<any> {
    this.logger.verbose(`With in getcertifieddevicedaterangeBygroupid`);
    let queryBuilder;
    if (pageNumber === undefined || pageNumber === null) {
      pageNumber = 1;
    }
    const pageSize = 10;
    let skip: number = (pageNumber - 1) * pageSize;

    queryBuilder = await this.checkdevcielogcertificaterepository
      .createQueryBuilder('deviceData')
      .leftJoin('device', 'd', 'deviceData.externalId = d.externalId')
      .select([
        'd.developerExternalId AS "externalId"',
        'MIN(deviceData.certificate_issuance_startdate) AS firstcertifiedstartdate',
        'MAX(deviceData.certificate_issuance_enddate) AS lastcertifiedenddate',
      ])
      .where('deviceData.groupId = :groupId', { groupId })
      .groupBy('d.developerExternalId')
      .offset(skip).limit(pageSize);
    const result = await queryBuilder.getRawMany();
    const count = await queryBuilder.getCount();
    const totalPages = Math.ceil(count / pageSize);
    //let finalresult = 
    return {
      certifieddevices_startToend: result,
      totalItems: count,
      currentPage: pageNumber,
      totalPages: totalPages,
    };

  }
  ///////////////////


  async remove(id: number, filterop): Promise<any> {
    this.logger.verbose(`With in remove`);
    let checkdeviceunreserve = await this.findOne(id, filterop)
    if (!checkdeviceunreserve) {
      const message = `Device id: ${checkdeviceunreserve.developerExternalId} already part of the reservation , you cannot delete it`;
      this.logger.error(message);
      return {
        success: false,
        message,
      };

    }
    let certifiedamountofread = await this.checkdevcielogcertificaterepository.findOne(
      {
        where: { externalId: checkdeviceunreserve.externalId }
      }
    )

    if (certifiedamountofread) {
      const message = `Device id: ${checkdeviceunreserve.developerExternalId} already certified in reservation , you cannot delete it`;
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
      message: "device deleted Successfully",

    }
  }
}