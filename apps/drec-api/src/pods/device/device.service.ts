import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Device, IDevice } from './device.entity';
import { NewDeviceDTO } from './dto/new-device.dto';
import { defaults } from 'lodash';
import { FilterDTO, UpdateDeviceDTO } from './dto';
import { DeviceStatus } from '@energyweb/origin-backend-core';
import { Role } from '../../utils/eums';
import { FindConditions, FindManyOptions, In } from 'typeorm';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device) private readonly repository: Repository<Device>,
  ) {}

  public async find(filterDto: FilterDTO): Promise<Device[]> {
    const query = this.getFilteredQuery(filterDto);
    return this.repository.find(query);
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

  public async register(
    orgCode: string,
    newDevice: NewDeviceDTO,
  ): Promise<Device> {
    const device = new Device({
      ...newDevice,
      registrant_organisation_code: orgCode,
    });

    return await this.repository.save(device);
  }

  async update(
    orgCode: string,
    id: number,
    updateDeviceDTO: UpdateDeviceDTO,
  ): Promise<Device> {
    const rule =
      orgCode === Role.DeviceOwner
        ? {
            where: {
              registrant_organisation_code: orgCode,
            },
          }
        : null;
    let currentDevice = await this.findOne(id, rule);
    if (!currentDevice) {
      throw new NotFoundException(`No device found with id ${id}`);
    }
    currentDevice = defaults(updateDeviceDTO, currentDevice);
    currentDevice.status = DeviceStatus.Submitted;
    return await this.repository.save(currentDevice);
  }

  private getFilteredQuery(filterDto: FilterDTO): FindManyOptions<Device> {
    const {
      fuel_code,
      device_type_code,
      installation_configuration,
      capacity,
      startDate,
      endDate,
      grid_interconnection,
      off_taker,
      sector,
      labels,
      standard_compliance,
    } = filterDto;
    let where: FindConditions<Device> = {};
    if (fuel_code) {
      where.fuel_code = fuel_code;
    }
    if (device_type_code) {
      where.device_type_code = device_type_code;
    }
    const query: FindManyOptions<Device> = {
      where,
    };
    return query;
  }
}
