import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindConditions,
  FindManyOptions,
  In,
  FindOperator,
  Raw,
} from 'typeorm';
import { DeviceService } from '../device/device.service';
import {
  AddGroupDTO,
  DeviceGroupDTO,
  DeviceIdsDTO,
  NewDeviceGroupDTO,
  ReserveGroupsDTO,
  UnreservedDeviceGroupDTO,
  UnreservedDeviceGroupsFilterDTO,
  UpdateDeviceGroupDTO,
} from './dto';
import { DeviceGroup } from './device-group.entity';
import { Device } from '../device/device.entity';
import { IDevice } from '../../models';
import { DeviceDTO, NewDeviceDTO } from '../device/dto';
import {
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
} from '../../utils/enums';
import { groupByProps } from '../../utils/group-by-properties';
import { getCapacityRange } from '../../utils/get-capacity-range';
import { getDateRangeFromYear } from '../../utils/get-commissioning-date-range';
import cleanDeep from 'clean-deep';
import { getCodeFromCountry } from '../../utils/getCodeFromCountry';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class DeviceGroupService {
  private readonly logger = new Logger(DeviceGroupService.name);

  constructor(
    @InjectRepository(DeviceGroup)
    private readonly repository: Repository<DeviceGroup>,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
  ) {}

  async getAll(): Promise<DeviceGroupDTO[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<DeviceGroupDTO> {
    const deviceGroup = await this.repository.findOne({
      id,
    });
    if (!deviceGroup) {
      throw new NotFoundException(`No device group found with id ${id}`);
    }
    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    const organization = await this.organizationService.findOne(
      deviceGroup.organizationId,
    );
    deviceGroup.organization = {
      name: organization.name,
    };
    return deviceGroup;
  }

  async getOrganizationDeviceGroups(
    organizationId: number,
  ): Promise<DeviceGroupDTO[]> {
    return this.repository.find({ where: { organizationId } });
  }

  async findOne(
    conditions: FindConditions<DeviceGroup>,
  ): Promise<DeviceGroupDTO | null> {
    return (await this.repository.findOne(conditions)) ?? null;
  }

  async getUnreserved(
    filterDto: UnreservedDeviceGroupsFilterDTO,
  ): Promise<UnreservedDeviceGroupDTO[]> {
    const query = this.getUnreservedFilteredQuery(filterDto);
    const deviceGroups = await this.repository.find(query);

    const res = await Promise.all(
      deviceGroups.map(async (deviceGroup: DeviceGroupDTO) => {
        const organization = await this.organizationService.findOne(
          deviceGroup.organizationId,
        );
        return {
          ...deviceGroup,
          organization: {
            name: organization.name,
          },
          selected: false,
        };
      }),
    );
    return res;
  }

  async reserveGroup(
    data: ReserveGroupsDTO,
    organizationId: number,
    blockchainAccountAddress: string | undefined,
  ): Promise<DeviceGroupDTO[]> {
    const deviceGroups = await this.repository.findByIds(data.groupsIds);
    const updatedDeviceGroups: DeviceGroupDTO[] = [];
    await Promise.all(
      deviceGroups.map(async (deviceGroup: DeviceGroupDTO) => {
        deviceGroup.buyerId = organizationId;
        if (blockchainAccountAddress) {
          deviceGroup.buyerAddress = blockchainAccountAddress;
        }
        const updatedGroup = await this.repository.save(deviceGroup);
        updatedDeviceGroups.push(updatedGroup);
      }),
    );

    return updatedDeviceGroups;
  }

  async create(
    organizationId: number,
    data: NewDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {
    await this.checkNameConflict(data.name);
    const group = await this.repository.save({
      organizationId,
      ...data,
    });
    // For each device id, add the groupId but make sure they all belong to the same owner
    const devices = await this.deviceService.findByIds(data.deviceIds);

    const firstDevice = devices[0];
    const ownerCode = devices[0].organizationId;
    await Promise.all(
      devices.map(async (device: Device) => {
        if (await this.compareDeviceForGrouping(firstDevice, device)) {
          return await this.deviceService.addToGroup(
            device,
            group.id,
            ownerCode,
          );
        }
        return;
      }),
    );

    return group;
  }

  async createOne(
    organizationId: number,
    group: AddGroupDTO,
  ): Promise<DeviceGroupDTO> {
    const devices = await this.deviceService.findByIds(group.deviceIds);
    return await this.create(
      organizationId,
      this.createDeviceGroupFromDevices(devices, group.name),
    );
  }

  async createMultiple(
    organizationId: number,
    groups: AddGroupDTO[],
  ): Promise<DeviceGroupDTO[]> {
    return await Promise.all(
      groups.map(async (group: AddGroupDTO) => {
        const devices = await this.deviceService.findByIds(group.deviceIds);
        return await this.create(
          organizationId,
          this.createDeviceGroupFromDevices(devices, group.name),
        );
      }),
    );
  }

  async addDevices(
    id: number,
    organizationId: number,
    data: DeviceIdsDTO,
  ): Promise<DeviceGroupDTO | void> {
    const deviceGroup = await this.findDeviceGroupById(id, organizationId);

    const ownerCode = (
      (await this.deviceService.findForGroup(id)) as Device[]
    )[0]?.organizationId;
    const devices = await this.deviceService.findByIds(data.deviceIds);

    if (!data?.deviceIds?.length) {
      return;
    }

    await Promise.all(
      devices.map(async (device: Device) => {
        await this.deviceService.addToGroup(device, id, ownerCode);
      }),
    );
    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    return deviceGroup;
  }

  async removeDevices(
    id: number,
    organizationId: number,
    data: DeviceIdsDTO,
  ): Promise<DeviceGroupDTO | void> {
    const deviceGroup = await this.findDeviceGroupById(id, organizationId);

    if (!data?.deviceIds?.length) {
      return;
    }

    await Promise.all(
      data.deviceIds.map(async (deviceId: number) => {
        await this.deviceService.removeFromGroup(deviceId, id);
      }),
    );

    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    return deviceGroup;
  }

  async update(
    id: number,
    organizationId: number,
    data: UpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {
    await this.checkNameConflict(data.name);
    const deviceGroup = await this.findDeviceGroupById(id, organizationId);

    deviceGroup.name = data.name;

    const updatedGroup = await this.repository.save(deviceGroup);

    updatedGroup.devices = await this.deviceService.findForGroup(
      deviceGroup.id,
    );
    return updatedGroup;
  }

  async remove(id: number, organizationId: number): Promise<void> {
    const deviceGroup = await this.findDeviceGroupById(id, organizationId);

    const devices = await this.deviceService.findForGroup(deviceGroup.id);
    await Promise.all(
      devices.map(async (device: Device) => {
        return await this.deviceService.removeFromGroup(
          device.id,
          deviceGroup.id,
        );
      }),
    );
    await this.repository.delete(id);
  }

  public async registerBulkDevices(
    orgCode: number,
    newDevices: NewDeviceDTO[],
  ): Promise<DeviceGroupDTO[]> {
    const devices: DeviceDTO[] = await Promise.all(
      newDevices.map(
        async (device: NewDeviceDTO) =>
          await this.deviceService.register(orgCode, device),
      ),
    );

    // Create groups automatically based on criteria
    const groupedDevicesByProps: DeviceDTO[][] = groupByProps(
      devices,
      (item) => {
        return [
          item['organizationId'],
          item['countryCode'],
          item['fuelCode'],
          item['standardCompliance'],
          item['installationConfiguration'],
          item['offTaker'],
        ];
      },
    );
    const createdDeviceGroups: DeviceGroupDTO[] = await Promise.all(
      groupedDevicesByProps.map(
        async (groupedDeviceList: DeviceDTO[]) =>
          await this.create(
            orgCode,
            this.createDeviceGroupFromDevices(groupedDeviceList),
          ),
      ),
    );
    return createdDeviceGroups;
  }

  private async hasDeviceGroup(conditions: FindConditions<DeviceGroup>) {
    return Boolean(await this.findOne(conditions));
  }

  private async checkNameConflict(name: string): Promise<void> {
    const isExistingDeviceGroup = await this.hasDeviceGroup({ name: name });
    if (isExistingDeviceGroup) {
      const message = `Device group with name ${name} already exists`;

      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
  }

  private async findDeviceGroupById(
    id: number,
    organizationId: number,
  ): Promise<DeviceGroupDTO> {
    const deviceGroup = await this.repository.findOne({
      id,
      organizationId,
    });
    if (!deviceGroup) {
      throw new NotFoundException(
        `No device group found with id ${id} and organization ${organizationId}`,
      );
    }
    return deviceGroup;
  }

  private async compareDeviceForGrouping(
    initialDevice: IDevice,
    deviceToCompare: IDevice,
  ): Promise<boolean> {
    if (
      !initialDevice ||
      !deviceToCompare ||
      initialDevice.countryCode !== deviceToCompare.countryCode ||
      initialDevice.fuelCode !== deviceToCompare.fuelCode ||
      initialDevice.standardCompliance !== deviceToCompare.standardCompliance
    ) {
      return false;
    }
    return true;
  }

  private getCommissioningDateRange(
    devices: DeviceDTO[],
  ): CommissioningDateRange[] {
    const dates = Array.from(
      new Set(
        devices.map((device: DeviceDTO) =>
          getDateRangeFromYear(device.commissioningDate),
        ),
      ),
    );
    return dates;
  }

  private createDeviceGroupFromDevices(
    devices: DeviceDTO[],
    groupName?: string,
  ): NewDeviceGroupDTO {
    const aggregatedCapacity = Math.floor(
      devices.reduce(
        (accumulator, currentValue: DeviceDTO) =>
          accumulator + currentValue.capacity,
        0,
      ),
    );
    const averageYieldValue = Math.floor(
      devices.reduce(
        (accumulator, currentValue: DeviceDTO) =>
          accumulator + currentValue.yieldValue,
        0,
      ) / devices.length,
    );
    const gridInterconnection = devices.every(
      (device: DeviceDTO) => device.gridInterconnection === true,
    );
    const sectors = Array.from(
      new Set(devices.map((device: DeviceDTO) => device.sector)),
    );

    const deviceGroup: NewDeviceGroupDTO = {
      name:
        groupName ||
        `${devices[0].countryCode},${devices[0].fuelCode},${devices[0].standardCompliance},${devices[0].offTaker},${devices[0].installationConfiguration}`,
      deviceIds: devices.map((device: DeviceDTO) => device.id),
      fuelCode: devices[0].fuelCode,
      countryCode: devices[0].countryCode,
      standardCompliance: devices[0].standardCompliance,
      deviceTypeCodes: devices.map(
        (device: DeviceDTO) => device.deviceTypeCode,
      ),
      offTakers: [devices[0].offTaker],
      installationConfigurations: [devices[0].installationConfiguration],
      sectors,
      gridInterconnection,
      aggregatedCapacity,
      capacityRange: getCapacityRange(aggregatedCapacity),
      commissioningDateRange: this.getCommissioningDateRange(devices),
      yieldValue: averageYieldValue,
      labels: devices.map((device: DeviceDTO) => device.labels),
    };

    return deviceGroup;
  }

  private getUnreservedFilteredQuery(
    filter: UnreservedDeviceGroupsFilterDTO,
  ): FindManyOptions<DeviceGroup> {
    const where: FindConditions<DeviceGroup> = cleanDeep({
      countryCode: filter.country,
      fuelCode: filter.fuelCode,
      standardCompliance: filter.standardCompliance,
      gridInterconnection: filter.gridInterconnection,
      capacityRange: filter.capacityRange,
    });
    if (filter.sector) {
      where.sectors = this.getRawFilter(filter.sector);
    }
    if (filter.installationConfiguration) {
      where.installationConfigurations = this.getRawFilter(
        filter.installationConfiguration,
      );
    }
    if (filter.offTaker) {
      where.offTakers = this.getRawFilter(filter.offTaker);
    }
    if (filter.commissioningDateRange) {
      where.commissioningDateRange = this.getRawFilter(
        filter.commissioningDateRange,
      );
    }
    const query: FindManyOptions<DeviceGroup> = {
      where: {
        buyerAddress: null,
        buyerId: null,
        ...where,
      },
      order: {
        organizationId: 'ASC',
      },
    };
    return query;
  }

  private getRawFilter(
    filter:
      | Sector
      | Installation
      | OffTaker
      | Installation
      | CommissioningDateRange,
  ): FindOperator<any> {
    return Raw((alias) => `${alias} @> ARRAY[:...filterSectors]`, {
      filterSectors: [filter],
    });
  }
}
