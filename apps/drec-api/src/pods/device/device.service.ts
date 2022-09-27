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
import { DeviceOrderBy, Integrator, Role } from '../../utils/enums';
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

import { FilterKeyDTO } from '../countrycode/dto';
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

    return devices;
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
    const groupdevice = await this.repository.find({
      where: { groupId },
      order: {
        createdAt: 'DESC',
      },


    });
    console.log(groupdevice)

    const deviceGroupedByCountry = this.groupBy(groupdevice, 'countryCode');
    console.log(deviceGroupedByCountry);
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
        id: In(ids), groupId: IsNull()
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

    const code = newDevice.countryCode.toUpperCase();
    newDevice.countryCode = code;


    return await this.repository.save({
      ...newDevice,
      organizationId: orgCode,
    });
  }

  async update(
    organizationId: number,
    role: Role,
    id: number,
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
    let currentDevice = await this.findOne(id, rule);
    if (!currentDevice) {
      throw new NotFoundException(`No device found with id ${id}`);
    }
    currentDevice = defaults(updateDeviceDTO, currentDevice);
    currentDevice.status = DeviceStatus.Submitted;
    return await this.repository.save(currentDevice);
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
      .andWhere("device.status ='Requested' OR device.status ='Succeeded'")
      .andWhere(
        new Brackets((db) => {
          db.where("device.certificate_issuance_startdate BETWEEN :startDateFirstWhere AND :endDateFirstWhere ", { startDateFirstWhere: startDate, endDateFirstWhere: endDate })
            .orWhere("device.certificate_issuance_enddate BETWEEN :startDateSecondtWhere AND :endDateSecondWhere", { startDateSecondtWhere: startDate, endDateSecondWhere: endDate })
            .orWhere(":startdateThirdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate", { startdateThirdWhere: startDate })
            .orWhere(":enddateforthdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate", { enddateforthdWhere: endDate })

        }),
      )
    console.log(query.getQuery())
    return query;
  }
}