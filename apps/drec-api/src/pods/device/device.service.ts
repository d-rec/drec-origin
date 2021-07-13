import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Device, IDevice } from './device.entity';
import { NewDeviceDTO } from './dto/new-device.dto';
import { defaults } from 'lodash';
import { UpdateDeviceDTO } from './dto';
import { DeviceStatus } from '@energyweb/origin-backend-core';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device) private readonly repository: Repository<Device>,
  ) {}

  public async find(options?: FindManyOptions<Device>): Promise<Device[]> {
    return this.repository.find(options);
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

  public async seed(newDevice: NewDeviceDTO): Promise<Device['id']> {
    const storedDevice = await this.repository.save({
      ...newDevice,
    });

    return storedDevice.id;
  }

  public async register(newDevice: NewDeviceDTO): Promise<Device> {
    const device = new Device(newDevice);
    return await this.repository.save(device);
  }

  async update(id: number, updateDeviceDTO: UpdateDeviceDTO): Promise<Device> {
    let currentDevice = await this.findOne(id);
    if (!currentDevice) {
      throw new NotFoundException(`No device found with id ${id}`);
    }
    currentDevice = defaults(updateDeviceDTO, currentDevice);
    currentDevice.status = DeviceStatus.Submitted;
    return await this.repository.save(currentDevice);
  }
}
