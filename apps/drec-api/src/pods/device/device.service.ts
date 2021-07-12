import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Device, IDevice } from './device.entity';
import { NewDeviceDTO } from './dto/new-device.dto';
import { defaults } from 'lodash';
import { UpdateDeviceDTO } from './dto';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device) private readonly repository: Repository<Device>,
  ) {}

  public async find(options?: FindManyOptions<Device>): Promise<Device[]> {
    return this.repository.find(options);
  }

  public async findByIds(ids: string[]): Promise<IDevice[]> {
    return await this.repository.findByIds(ids);
  }

  async findOne(
    id: string,
    options?: FindOneOptions<Device>,
  ): Promise<Device | null> {
    return (await this.repository.findOne(id, options)) ?? null;
  }

  public async register(newDevice: NewDeviceDTO): Promise<Device['id']> {
    const storedDevice = await this.repository.save({
      ...newDevice,
    });

    return storedDevice.id;
  }

  async update(id: string, updateDeviceDTO: UpdateDeviceDTO): Promise<Device> {
    let currentDevice = await this.findOne(id);
    if (!currentDevice) {
      throw new NotFoundException(`No device found with id ${id}`);
    }
    currentDevice = defaults(updateDeviceDTO, currentDevice);
    return await this.repository.save(currentDevice);
  }
}
