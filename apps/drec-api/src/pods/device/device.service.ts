import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository, In } from 'typeorm';
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
import { FindConditions, FindManyOptions, Between,LessThanOrEqual  } from 'typeorm';
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

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(Device) private readonly repository: Repository<Device>,
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

  public async findByIds(ids: number[]): Promise<Device[]> {
    return await this.repository.findByIds(ids);
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
      return devices[0][deviceKey];
    })}`;
    return name;
  }

  private getFilteredQuery(filter: FilterDTO): FindManyOptions<Device> {
    const where: FindConditions<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
      deviceTypeCode: filter.deviceTypeCode,
      installationConfiguration: filter.installationConfiguration,
      capacity: filter.capacity,
      gridInterconnection: filter.gridInterconnection,
      offTaker: filter.offTaker,
      sector: filter.sector,
      labels: filter.labels,
      standardCompliance: filter.standardCompliance,
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
      throw new NotFoundException(
        `No device found with id ${deviceId} and groupId: ${groupId}`,
      );
    }
    currentDevice.groupId = null;

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
    console.log(filterDto)
    
    let query = this.getBuyerFilteredQuery(filterDto);
    console.log(query)
    let where:any= query.where
    console.log(where)
    where = {...where, groupId:null};
    console.log(where)
    query.where=where;
   
   console.log(query)
    return this.repository.find(query);
  }
}
