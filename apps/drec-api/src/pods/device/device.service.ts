import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
  HttpException,
  HttpStatus,
  HttpService,
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
  BuyerDeviceFilterDTO,
} from './dto';
import { DeviceStatus } from '@energyweb/origin-backend-core';
import { DeviceOrderBy, Integrator, ReadType, Role, SDGBenefitsList } from '../../utils/enums';
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
import {regenerateToken} from '../../utils/evident-login';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { SingleDeviceIssuanceStatus } from '../../utils/enums'
import { DateTime } from 'luxon';
import { FilterKeyDTO } from '../countrycode/dto';
import { InfluxDB, FluxTableMetaData } from '@influxdata/influxdb-client';
import { SDGBenefits } from '../../models/Sdgbenefit'
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuid } from 'uuid';
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { Observable } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(HistoryIntermediate_MeterRead) private readonly historyrepository: Repository<HistoryIntermediate_MeterRead>,
    @InjectRepository(Device) private readonly repository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly checkdevcielogcertificaterepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    private httpService: HttpService

  ) { }

  public async find(filterDto: FilterDTO, pagenumber: number): Promise<{ devices: Device[], currentPage, totalPages, totalCount }> {
    const limit = 20;
    let query = await this.getFilteredQuery(filterDto)
    if (pagenumber) {
      query = {
        ...query, skip: (pagenumber - 1) * limit,
        take: limit
      }
    }

    console.log(query);
    const [devices, totalCount] = await this.repository.findAndCount(query);
    //devices.externalId = devices.developerExternalId
    const totalPages = Math.ceil(totalCount / 20);
    const currentPage = pagenumber;
    const newDevices = [];

    await devices.map((device: Device) => {

     // device.externalId = device.developerExternalId
     // delete device["developerExternalId"];
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
    return this.repository.find({
      where: {
        integrator,
      },
    });
  }

  async getOrganizationDevices(organizationId: number, filterDto: FilterDTO, pagenumber: number): Promise<any> {

    if ( Object.keys(filterDto).length != 0) {
      if (pagenumber === null || pagenumber === undefined) {
        pagenumber = 1
      }
      const limit = 20;
      const query = await this.getFilteredQuery(filterDto);
      let where: any = query.where
      where = { ...where, organizationId };
      query.where = where;
     // console.log(query);
      const [devices, totalCount] = await this.repository.findAndCount({
        ...query, skip: (pagenumber - 1) * limit,
        take: limit,
        order: {
          createdAt: 'DESC',
        }
      });
      console.log((pagenumber - 1) * limit);
     console.log(totalCount);
      const totalPages = Math.ceil(totalCount / limit);
       if (pagenumber > totalPages) {
      throw new HttpException('Page number out of range', HttpStatus.NOT_FOUND);
    }
      const currentPage = pagenumber;
      const newDevices = [];
      await devices.map((device: Device) => {
        device.externalId = device.developerExternalId
        delete device["developerExternalId"];
        newDevices.push(device);
      })
      return {
        devices: newDevices,
        currentPage,
        totalPages,
        totalCount
      };
    }

    const devices = await this.repository.find({
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
      newDevices.push(device);
    })
    return newDevices
  }

  @Cron('*/30 * * * * *') // Cron pattern for running every 30 seconds
  async fetchDataCronJob() {
    try {
      const data = await this.fetchDataFromApi();
      console.log('Fetched data:', data);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }
  async fetchDataFromApi(): Promise<any> {
    console.log("hitting api");
    const apiUrl = `${process.env.IREC_EVIDENT_API_URL}/devices/2A70ES100011`;
    let jwtToken = await regenerateToken(this.httpService);
    console.log("jwtToken",jwtToken);
    const headers = {
      // Add your custom headers here
      'Authorization': `Bearer ${jwtToken}`
    };

    const response = await this.httpService.get(apiUrl,{headers}).toPromise();
    return response.data;
  }



  @Cron('*/30 * * * * *')
  async postData(): Promise<Observable<any>> {
    const device = await this.repository.findOne({
      where: { IREC_Status:'NotRegistered' },
      order: {
        createdAt: 'DESC',
      },
    });
    if(device)
    {
      let jwtToken = await regenerateToken(this.httpService);
      const headers = {
        'Content-Type': 'application/json', // Set the Content-Type header for JSON data
        'Authorization': `Bearer ${jwtToken}`
        // Add any other custom headers if needed
      };
  
      const requestBody ={
        "name": device.externalId,
        "fuel": device.fuelCode
      }
   
     console.log("jwtToken",jwtToken);
  
      const config: AxiosRequestConfig = {
        headers, // Set the headers in the config object
        
      };
  
      const url = `${process.env.IREC_EVIDENT_API_URL}/devices`;// Replace with your API endpoint
      return this.httpService.post(url, requestBody, config); //
    }
    
  }




  public async findForDevicesWithDeviceIdAndOrganizationId(
    deviceIds: Array<number>,
    organizationId: number,
  ): Promise<Device[]> {
    return this.repository.find({
      where: { id: In(deviceIds), organizationId },
    });
  }

  public async findForGroup(groupId: number): Promise<Device[]> {
    return this.repository.find({
      where: { groupId },
      order: {
        createdAt: 'DESC',
      },

    });
  }
  public async NewfindForGroup(groupId: number): Promise<{ [key: string]: Device[] }> {

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

    return array.reduce((result: any, currentValue: any) => {

      (result[currentValue[key]] = result[currentValue[key]] || []).push(
        currentValue
      );

      return result;
    }, {});
  };
  public async findByIds(ids: number[]): Promise<Device[]> {
    return await this.repository.findByIds(ids);
  }

  public async findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation(ids: number[]): Promise<Device[]> {
    //console.log("ids", ids)
    return await this.repository.find({
      where: {
        //id: In(ids), groupId: IsNull()
        id: In(ids)
        //, groupId: IsNull()
      }
    });
  }

  async findOne(
    id: number,
    options?: FindOneOptions<Device>,
  ): Promise<Device | null> {
    return (await this.repository.findOne(id, options)) ?? null;
  }

  async findReads(meterId: string): Promise<DeviceDTO | null> {
    return (
      (await this.repository.findOne({ where: { externalId: meterId } })) ??
      null
    );
  }

  async findDeviceByDeveloperExternalId(meterId: string, organizationId: number): Promise<Device | null> {
    //change whare condition filter by developerExternalId instead of externalId and organizationid
    return (
      (await this.repository.findOne({
        where: {
          developerExternalId: meterId,
          organizationId: organizationId
        }
      })) ??
      null
    );
  }
  async findMultipleDevicesBasedExternalId(
    meterIdList: Array<string>,
    organizationId: number
  ): Promise<Array<DeviceDTO | null>> {
    //console.log("meterIdList", meterIdList);
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
    const storedDevice = await this.repository.save({
      ...newDevice,
      organizationId: orgCode,
    });

    return storedDevice.id;
  }

  public async register(
    orgCode: number,
    newDevice: NewDeviceDTO,
  ): Promise<Device> {
    //console.log(orgCode);
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
      console.log("236");
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
    const result = await this.repository.save({
      ...newDevice,
      organizationId: orgCode,
    });
    result.externalId = result.developerExternalId;
    delete result["developerExternalId"];
    return result
  }
  async update(
    organizationId: number,
    role: Role,
    externalId: string,
    updateDeviceDTO: UpdateDeviceDTO,
  ): Promise<Device> {
    const rule =
      role === Role.DeviceOwner
        ? {
          where: {
            organizationId,
          },
        }
        : undefined;
    //console.log(rule);
    let currentDevice = await this.findDeviceByDeveloperExternalId(externalId.trim(), organizationId);
    if (!currentDevice) {
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
    //console.log(result);
    return result;
  }

  async findUngrouped(
    organizationId: number,
    orderFilterDto: DeviceGroupByDTO,
  ): Promise<GroupedDevicesDTO[]> {
    const devices = await this.repository.find({
      where: { groupId: null, organizationId },
    });
    return this.groupDevices(orderFilterDto, devices);
  }

  getDeviceTypes(): CodeNameDTO[] {
    return IREC_DEVICE_TYPES;
  }

  getFuelTypes(): CodeNameDTO[] {
    return IREC_FUEL_TYPES;
  }

  isValidDeviceType(deviceType: string): boolean {
    return !!this.getDeviceTypes().find((device) => device.code === deviceType);
  }

  isValidFuelType(fuelType: string): boolean {
    return !!this.getFuelTypes().find((fuel) => fuel.code === fuelType);
  }

  groupDevices(
    orderFilterDto: DeviceGroupByDTO,
    devices: Device[],
  ): GroupedDevicesDTO[] {
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

  private getFilteredQuery(filter: FilterDTO): FindManyOptions<Device> {
    const limit = 20;

    const where: FindConditions<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
     // deviceTypeCode: filter.deviceTypeCode,
      capacity: filter.capacity && LessThanOrEqual(filter.capacity),
      gridInterconnection: filter.gridInterconnection,
     // offTaker: filter.offTaker,
      countryCode: filter.country && getCodeFromCountry(filter.country),

    });
    console.log(filter.end_date);
    if (filter.start_date != null && filter.end_date === undefined) {
      console.log(filter.start_date);
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
      console.log(typeof filter.SDGBenefits)
      const newsdg = filter.SDGBenefits.toString()
      const sdgBenefitsArray = newsdg.split(',');
      console.log(sdgBenefitsArray)
      where.SDGBenefits = Raw(alias => `${alias} ILIKE ANY(ARRAY[${sdgBenefitsArray.map(term => `'%${term}%'`)}])`);
      // where.SDGBenefits = this.getRawFilter(filter.SDGBenefits.toString());
    }
    if (filter.deviceTypeCode) {
      console.log(typeof filter.deviceTypeCode)
      const newdtype = filter.deviceTypeCode.toString()
      const newdtypeArray = newdtype.split(',');
      console.log(newdtypeArray)
      where.deviceTypeCode = Raw(alias => `${alias} ILIKE ANY(ARRAY[${newdtypeArray.map(term => `'%${term}%'`)}])`);
      
    }
    if (filter.offTaker) {
      console.log(typeof filter.offTaker)
      const newoffTaker = filter.offTaker.toString()
      const newoffTakerArray = newoffTaker.split(',');
      console.log(newoffTakerArray)
      where.offTaker = Raw(alias => `${alias} ILIKE ANY(ARRAY[${newoffTakerArray.map(term => `'%${term}%'`)}])`);
      
    }
    //console.log(where)
    const query: FindManyOptions<Device> = {
      where,
      order: {
        organizationId: 'ASC',
      }

    };
    console.log(query)
    return query;
  }
  private getRawFilter(
    filter:
      | String
    ,
  ): FindOperator<any> {

    return Raw((alias) => `${alias} = Any(SDGBenefits)`, {
      SDGBenefits: [filter]
    });
  }
  public async addGroupIdToDeviceForReserving(
    currentDevice: Device,
    groupId: number
  ): Promise<Device> {
    currentDevice.groupId = groupId;
    return await this.repository.save(currentDevice);
  }

  public async addToGroup(
    currentDevice: Device,
    groupId: number,
    organizationOwnerCode?: number,
  ): Promise<Device> {
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
    const currentDevice = await this.getDeviceForGroup(deviceId, groupId);
    if (!currentDevice) {
      // throw new NotFoundException(
      //   `No device found with id ${deviceId} and groupId: ${groupId}`,
      // );
      console.error(`in removeFromGroup 373 No device found with id ${deviceId} and groupId: ${groupId}`);
    }
    currentDevice ? currentDevice.groupId = null : '';

    return await this.repository.save(currentDevice);
  }

  private async getDeviceForGroup(
    deviceId: number,
    groupId: number,
  ): Promise<Device | undefined> {
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

    const devicereadtype = await this.repository.findOne({
      where: {
        externalId: deviceId,
      }
    });
    if (!devicereadtype) {
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    devicereadtype.meterReadtype = meterReadtype;

    return await this.repository.save(devicereadtype);

  }
  public async updatetimezone(
    deviceId: string,
    timeZone: string,
  ): Promise<Device> {

    const devicereadtype = await this.repository.findOne({
      where: {
        externalId: deviceId,
      }
    });
    if (!devicereadtype) {
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    devicereadtype.timezone = timeZone;

    return await this.repository.save(devicereadtype);

  }
  //
  private getBuyerFilteredQuery(filter: FilterDTO, pagenumber, limit): FindManyOptions<Device> {
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
  public async finddeviceForBuyer(filterDto: FilterDTO, pagenumber): Promise<any> {
    const limit = 20;
    let query = this.getFilteredQuery(filterDto);
    if (pagenumber) {
      query = {
        ...query, skip: (pagenumber - 1) * limit,
        take: limit
      }
    }
    let where: any = query.where

    where = { ...where, groupId: null };

    query.where = where;

    const [devices, totalCount] = await this.repository.findAndCount(query);

    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = pagenumber;

    const newUnreservedDevices = devices.map((device: Device) => {
      device.externalId = device.developerExternalId;
      delete device["developerExternalId"];
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
    const fluxQuery =
      `from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: 0)
      |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")`
    return await this.execute(fluxQuery);
  }
  async execute(query: any) {

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
      throw new HttpException('The given device already had some meter reads;Thus you cannot change the createdAt', 409);
    }
  }



  async getNumberOfHistReads(deviceId): Promise<number> {
    const query = this.historyrepository.createQueryBuilder("devicehistory")
      .where("devicehistory.externalId = :deviceId", { deviceId });
    const count = await query.getCount();
    return count;
  }



  async getNumberOfOngReads(externalId, onboardedDate): Promise<number> {
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
    console.log("query started")
    const data: any = await this.dbReader.collectRows(query);
    console.log("query ended");

    if (typeof data[0] === 'undefined' || data.length == 0) {
      return 0;
    }
    return Number(data[0]._value);
  }


  async changecreatedAtDate(onboardedDate, givenDate, externalId) {
    console.log("THE EXTERNALID IS::::::::::::::::::::::::" + externalId);
    const sixMonthsAgo = new Date(onboardedDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (new Date(givenDate) < sixMonthsAgo || new Date(givenDate) >= new Date(onboardedDate)) {
      throw new HttpException('Given date is more than 6 months before the onboarded date or after or equal to the onboarded date', 400);
    }

    await this.repository.update(
      { createdAt: onboardedDate, externalId: externalId },
      { createdAt: givenDate },
    );
    return `Changed createdAt date from ${onboardedDate} to ${givenDate}`;
  }
  /* */

  ////////////////////////////////////////

  public async atto(organizationId, externalId) {
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
      console.log(rows);
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
  async getcertifieddevicedaterange(device, groupId): Promise<any> {
    // // const query = {
    // //   select: ['MIN(entryTime) AS firstEntryTime', 'MAX(entryTime) AS lastEntryTime'],
    // //   where: { deviceid: externalId, groupId },
    // // };
    // const query: FindManyOptions<CheckCertificateIssueDateLogForDeviceEntity> = {
    //   select: ['MIN(checkCertificateIssueDateLogForDevice.certificate_issuance_startdate) AS firststartdateTime', 'MAX(checkCertificateIssueDateLogForDevice.certificate_issuance_enddate) AS lastenddateTime'],
    //   where: { deviceid: externalId, groupId },
    // };
    // const result = await this.checkdevcielogcertificaterepository.find(query);
    // console.log(result)
    // return result[0];
    //console.log(device);
    //console.log(groupId)
    // const result = this.checkdevcielogcertificaterepository.find({
    //   where: {
    //     deviceid: externalId,
    //     groupId: groupId[]
    //   }
    // })
    const queryBuilder = this.checkdevcielogcertificaterepository.createQueryBuilder('deviceData')
      .select('MIN(deviceData.certificate_issuance_startdate)', 'firstcertifiedstartdate')
      .addSelect('MAX(deviceData.certificate_issuance_enddate)', 'lastcertifiedenddate')
      .where('deviceData.externalId= :externalId', { externalId: device.externalId })
      .andWhere('deviceData.groupId= :groupId', { groupId });

    const result = await queryBuilder.getRawOne();
    let finalresult = { ...result, extenalId: device.developerExternalId }
    return finalresult;
  }
  ///////////////////
}