import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Device } from './device.entity';
import { NewDeviceDTO } from './dto/new-device.dto';
import { defaults } from 'lodash';
import { DeviceDTO, FilterDTO, UpdateDeviceDTO } from './dto';
import { DeviceStatus } from '@energyweb/origin-backend-core';
import { DeviceOrderBy, Role } from '../../utils/enums';
import { FindConditions, FindManyOptions, Between } from 'typeorm';
import cleanDeep from 'clean-deep';
import { Countries } from '@energyweb/utils-general';
import { DeviceKey, DeviceSortPropertyMapper, IDevice } from '../../models';
import { CodeNameDTO } from './dto/code-name';
import { IREC_DEVICE_TYPES, IREC_FUEL_TYPES } from './Fuels';
import { OrderByDTO } from './dto/device-order-by.dto';
import { EntityFieldsNames } from 'typeorm/common/EntityFieldsNames';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(Device) private readonly repository: Repository<Device>,
  ) {}

  public async find(filterDto: FilterDTO): Promise<Device[]> {
    const query = this.getFilteredQuery(filterDto);
    return this.repository.find(query);
  }

  public async findMultiple(
    options?: FindOneOptions<Device>,
  ): Promise<Device[]> {
    return this.repository.find(options);
  }

  async getOrganizationDevices(organizationId: number): Promise<Device[]> {
    const devices = await this.repository.find({
      where: { organizationId },
    });

    return devices;
  }

  public async findForGroup(groupId: number): Promise<Device[]> {
    return this.repository.find({ groupId });
  }

  public async findByIds(ids: number[]): Promise<IDevice[]> {
    return await this.repository.findByIds(ids);
  }

  async findOne(
    id: number,
    options?: FindOneOptions<Device>,
  ): Promise<Device | null> {
    return (await this.repository.findOne(id, options)) ?? null;
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
    orderFilterDto: OrderByDTO,
  ): Promise<DeviceDTO[]> {
    const query = this.getOrderQuery(organizationId, orderFilterDto);
    return this.repository.find(query);
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

  private getOrderQuery(
    organizationId: number,
    orderFilterDto: OrderByDTO,
  ): FindManyOptions<Device> {
    const { orderBy } = orderFilterDto;
    const orderDirection: 'ASC' | 'DESC' =
      orderFilterDto.orderDirection || 'DESC';
    const order: {
      [P in EntityFieldsNames<Device>]?: 'ASC' | 'DESC' | 1 | -1;
    } = {};
    if (orderBy) {
      const orderByRules: DeviceOrderBy[] = !Array.isArray(orderBy)
        ? [orderBy]
        : orderBy;
      orderByRules.forEach((item: DeviceOrderBy) => {
        if (DeviceSortPropertyMapper[item]) {
          const deviceKey: DeviceKey = DeviceSortPropertyMapper[
            item
          ] as DeviceKey;
          order[deviceKey] = orderDirection;
        }
      });
    }

    const query: FindManyOptions<Device> = {
      where: { groupId: null, organizationId },
      order,
    };
    return query;
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
      countryCode: filter.country && this.getCodeFromCountry(filter.country),
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

  private getCodeFromCountry(countryName: string) {
    if (!countryName) {
      return;
    }
    return Countries.filter((country) => country.name === countryName)[0].code;
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
}
