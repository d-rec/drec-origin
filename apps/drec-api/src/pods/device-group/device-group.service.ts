import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindConditions } from 'typeorm';
import { DeviceService } from '../device/device.service';
import {
  DeviceGroupDTO,
  DeviceIdsDTO,
  NewDeviceGroupDTO,
  UpdateDeviceGroupDTO,
} from './dto';
import { DeviceGroup } from './device-group.entity';
import { Device } from '../device/device.entity';
import { IDevice } from '../../models';
import { DeviceDTO, NewDeviceDTO } from '../device/dto';
import { CommissioningDateRange } from '../../utils/enums';
import { groupByProps } from '../../utils/group-by-properties';
import { getCapacityRange } from '../../utils/get-capacity-range';
import { getDateRangeFromYear } from '../../utils/get-commissioning-date-range';

@Injectable()
export class DeviceGroupService {
  private readonly logger = new Logger(DeviceGroupService.name);

  constructor(
    @InjectRepository(DeviceGroup)
    private readonly repository: Repository<DeviceGroup>,
    private deviceService: DeviceService,
  ) {}

  async getAll(): Promise<DeviceGroup[]> {
    return this.repository.find();
  }

  async findById(id: number, organizationId: number): Promise<DeviceGroup> {
    const deviceGroup = await this.findDeviceGroupById(id, organizationId);
    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    return deviceGroup;
  }

  async findOne(
    conditions: FindConditions<DeviceGroup>,
  ): Promise<DeviceGroup | null> {
    return (await this.repository.findOne(conditions)) ?? null;
  }

  async create(
    organizationId: number,
    data: NewDeviceGroupDTO,
  ): Promise<DeviceGroup> {
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

  async addDevices(
    id: number,
    organizationId: number,
    data: DeviceIdsDTO,
  ): Promise<DeviceGroup | void> {
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
  ): Promise<DeviceGroup | void> {
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
  ): Promise<DeviceGroup> {
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
    const devices: Device[] = await Promise.all(
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
    const createdDeviceGroups: DeviceGroup[] = await Promise.all(
      groupedDevicesByProps.map(
        async (groupedDevice: DeviceDTO[]) =>
          await this.create(
            orgCode,
            this.createDeviceGroupFromDevices(groupedDevice),
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
  ): Promise<DeviceGroup> {
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
  ): NewDeviceGroupDTO {
    const aggregatedCapacity = devices.reduce(
      (accumulator, currentValue: DeviceDTO) =>
        accumulator + currentValue.capacity,
      0,
    );
    const averageYieldValue =
      devices.reduce(
        (accumulator, currentValue: DeviceDTO) =>
          accumulator + currentValue.yieldValue,
        0,
      ) / devices.length;
    const gridInterconnection = devices.every(
      (device: DeviceDTO) => device.gridInterconnection === true,
    );
    const sectors = Array.from(
      new Set(devices.map((device: DeviceDTO) => device.sector)),
    );

    const deviceGroup: NewDeviceGroupDTO = {
      name: `Group_Country_${devices[0].countryCode}_Fuel_${devices[0].fuelCode}_StandardCompliance_${devices[0].standardCompliance}_OffTaker_${devices[0].offTaker}_InstallationConfiguration_${devices[0].installationConfiguration}`,
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
}
