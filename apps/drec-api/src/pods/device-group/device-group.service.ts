import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository, FindConditions } from 'typeorm';
import { DeviceService } from '../device/device.service';
import { DeviceIdsDTO, NewDeviceGroupDTO, UpdateDeviceGroupDTO } from './dto';
import { DeviceGroup } from './device-group.entity';
import { Device } from '../device/device.entity';

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

  async findById(id: number): Promise<DeviceGroup> {
    const deviceGroup = await this.findDeviceGroupById(id);
    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    return deviceGroup;
  }

  async findOne(
    conditions: FindConditions<DeviceGroup>,
  ): Promise<DeviceGroup | null> {
    return (await this.repository.findOne(conditions)) ?? null;
  }

  async create(
    organizationId: string,
    data: NewDeviceGroupDTO,
  ): Promise<DeviceGroup> {
    await this.checkNameConflict(data.name);

    const group = await this.repository.save({
      name: data.name,
      organizationId,
    });

    // For each device id, add the groupId but make sure they all belong to the same owner
    const devices = await this.deviceService.findByIds(data.deviceIds);
    const ownerCode = devices[0].registrant_organisation_code;
    await Promise.all(
      devices.map(async (device: Device) => {
        await this.deviceService.addToGroup(device, group.id, ownerCode);
      }),
    );

    return group;
  }

  async addDevices(id: number, data: DeviceIdsDTO): Promise<DeviceGroup> {
    const deviceGroup = await this.findDeviceGroupById(id);

    const ownerCode = ((await this.deviceService.findForGroup(id)[0]) as Device)
      ?.registrant_organisation_code;
    const devices = await this.deviceService.findByIds(data.deviceIds);

    await Promise.all(
      devices.map(async (device: Device) => {
        await this.deviceService.addToGroup(device, id, ownerCode);
      }),
    );
    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    return deviceGroup;
  }

  async removeDevices(id: number, data: DeviceIdsDTO): Promise<DeviceGroup> {
    const deviceGroup = await this.findDeviceGroupById(id);

    await Promise.all(
      data.deviceIds.map(async (deviceId: number) => {
        await this.deviceService.removeFromGroup(deviceId, id);
      }),
    );
    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    return deviceGroup;
  }

  async update(id: number, data: UpdateDeviceGroupDTO): Promise<DeviceGroup> {
    await this.checkNameConflict(data.name);
    const deviceGroup = await this.findDeviceGroupById(id);

    deviceGroup.name = data.name;
    const updatedGroup = await this.repository.save(deviceGroup);
    updatedGroup.devices = await this.deviceService.findForGroup(
      deviceGroup.id,
    );
    return updatedGroup;
  }

  async remove(id: number): Promise<void> {
    const deviceGroup = await this.findDeviceGroupById(id);

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

  private async findDeviceGroupById(id: number): Promise<DeviceGroup> {
    const deviceGroup = await this.repository.findOne(id);
    if (!deviceGroup) {
      throw new NotFoundException(`No device group found with id ${id}`);
    }
    return deviceGroup;
  }
}
