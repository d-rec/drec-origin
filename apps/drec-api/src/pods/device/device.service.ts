import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository, In, IsNull, Not, Brackets, SelectQueryBuilder, FindConditions, FindManyOptions, Between, LessThanOrEqual } from 'typeorm';
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
import { DeviceOrderBy, Integrator, ReadType, Role } from '../../utils/enums';
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
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { SingleDeviceIssuanceStatus } from '../../utils/enums'
import { DateTime } from 'luxon';
import { FilterKeyDTO } from '../countrycode/dto';
import { InfluxDB, FluxTableMetaData } from '@influxdata/influxdb-client';
import { SDGBenefits } from '../../models/Sdgbenefit'
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuid } from 'uuid';
@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(Device) private readonly repository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly checkdevcielogcertificaterepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,

  ) { }

  public async find(filterDto: FilterDTO): Promise<Device[]> {
    const query = this.getFilteredQuery(filterDto);
    return this.repository.find(query);
  }

  public async findForIntegrator(integrator: Integrator): Promise<Device[]> {
    return this.repository.find({
      where: {
        integrator,
      },
    });
  }

  async getOrganizationDevices(organizationId: number): Promise<Device[]> {
    console.log(organizationId);
    const devices = await this.repository.find({
      where: { organizationId },
    });
    //devices.externalId = devices.developerExternalId
    const newDevices = [];
   
       await devices.map((device: Device) => {
        
        device.externalId = device.developerExternalId
        delete device["developerExternalId"];
        newDevices.push(device);
      })
    
    // let totalamountofreads = [];
    //     await Promise.all(
    //       devices.map(async (device: Device) => {

    //         let certifiedamountofread = await this.checkdevcielogcertificaterepository.find(
    //           {
    //             where: { deviceid: device.externalId }
    //           }
    //         )
    //         const totalcertifiedReadValue = certifiedamountofread.reduce(
    //           (accumulator, currentValue) => accumulator + currentValue.readvalue_watthour,
    //           0,
    //         );
    //         let totalamount= await this.getallread(device.externalId);
    //         const totalReadValue = totalamount.reduce(
    //           (accumulator, currentValue) => accumulator + currentValue.value,
    //           0,
    //         );
    //         totalamountofreads.push({
    //           devicename: device.externalId,
    //           totalcertifiedReadValue: totalcertifiedReadValue,
    //           totalReadValue:totalReadValue
    //         })

    //       }))

    // console.log(totalamountofreads);
    return newDevices;
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
  public async NewfindForGroup(groupId: number, endDate: string): Promise<{ [key: string]: Device[] }> {

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
    console.log(array)

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
    console.log("ids", ids)
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
  ): Promise<Array<DeviceDTO | null>> {
    console.log("meterIdList", meterIdList);
    return (
      (await this.repository.find({
        where: { externalId: In(meterIdList) },
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
    console.log(orgCode);
    console.log(newDevice);
    const code = newDevice.countryCode.toUpperCase();
    newDevice.countryCode = code;
    let sdgbbenifitslist = SDGBenefits;

    const checkexternalid = await this.repository.findOne({
      where: {
        developerExternalId: newDevice.externalId,
        organizationId: orgCode

      }
    });
    console.log(checkexternalid)
    if (checkexternalid != undefined) {
      console.log("236");
      // return new Promise((resolve, reject) => {
      //   reject(
      //     new ConflictException({
      //       success: false,
      //       message: `ExternalId already exist in this organization, can't add entry with same external id ${newDevice.externalId}`,

      //     })
      //   );
      // });
      throw new ConflictException({
        success: false,
        message: `ExternalId already exist in this organization, can't add entry with same external id ${newDevice.externalId}`,
      })
      // return new NotFoundException(`ExternalId already exist in this organization, can't add entry with same external id ${newDevice.externalId}`);
    }
    newDevice.developerExternalId = newDevice.externalId;
    newDevice.externalId = uuid();
    console.log(newDevice.developerExternalId)
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
    console.log(rule);
    let currentDevice = await this.findDeviceByDeveloperExternalId(externalId, organizationId);
    if (!currentDevice) {
      throw new NotFoundException(`No device found with id ${externalId}`);
    }
    updateDeviceDTO.developerExternalId = updateDeviceDTO.externalId;
    console.log(updateDeviceDTO.countryCode);
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
    currentDevice.status = DeviceStatus.Submitted;
    const result = await this.repository.save(currentDevice);
    result.externalId = result.developerExternalId;
    delete result["developerExternalId"];
    console.log(result);
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
    const where: FindConditions<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
      deviceTypeCode: filter.deviceTypeCode,
      //installationConfiguration: filter.installationConfiguration,
      capacity: filter.capacity,
      gridInterconnection: filter.gridInterconnection,
      offTaker: filter.offTaker,
      //sector: filter.sector,
      labels: filter.labels,
      //standardCompliance: filter.standardCompliance,
      countryCode: filter.country && getCodeFromCountry(filter.country),
      commissioningDate:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),

    });
    const query: FindManyOptions<Device> = {
      where,
      order: {
        organizationId: 'ASC',
      },
    };
    return query;
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

  //
  private getBuyerFilteredQuery(filter: BuyerDeviceFilterDTO): FindManyOptions<Device> {
    const where: FindConditions<Device> = cleanDeep({

      fuelCode: filter.fuelCode,
      deviceTypeCode: filter.deviceTypeCode,
      capacity: filter.capacity && LessThanOrEqual(filter.capacity),
      offTaker: filter.offTaker,
      countryCode: filter.country && getCodeFromCountry(filter.country),


    });
    console.log(where);
    const query: FindManyOptions<Device> = {
      where,
      order: {
        organizationId: 'ASC',
      },
    };
    return query;
  }
  public async finddeviceForBuyer(filterDto: BuyerDeviceFilterDTO): Promise<Device[]> {

    let query = this.getBuyerFilteredQuery(filterDto);

    let where: any = query.where

    where = { ...where, groupId: null };

    query.where = where;
    return this.repository.find(query);
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
  //   console.log(deviceid)
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
  //   console.log(groupId);
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
          deviceid: s.device_deviceid
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
      where("device.deviceid = :deviceid", { deviceid: deviceid })
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
    //   console.log(query)
    // console.log(query.getQuery())
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
    console.log(organizationId);
    const devices = await this.repository.find({
      where: { organizationId },
    });
    let totalamountofreads = [];
    await Promise.all(
      devices.map(async (device: Device) => {

        let certifiedamountofread = await this.checkdevcielogcertificaterepository.find(
          {
            where: { deviceid: device.externalId }
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
          devicename: device.externalId,
          totalcertifiedReadValue: totalcertifiedReadValue,
          totalReadValue: totalReadValue
        })

      }))

    console.log(totalamountofreads);
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
}