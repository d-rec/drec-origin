import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Device, IDevice } from './device.entity';
import { NewDeviceDTO } from './dto/new-device.dto';
import { defaults } from 'lodash';
import { FilterDTO, UpdateDeviceDTO } from './dto';
import { DeviceStatus } from '@energyweb/origin-backend-core';
import { Role } from '../../utils/eums';
import { FindConditions, FindManyOptions, ILike, Between } from 'typeorm';
import cleanDeep from 'clean-deep';
import { Countries } from '@energyweb/utils-general';

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

  private getFilteredQuery(filter: FilterDTO): FindManyOptions<Device> {
    const where: FindConditions<Device> = cleanDeep({
      fuel_code: filter.fuel_code,
      device_type_code: filter.device_type_code,
      installation_configuration: filter.installation_configuration,
      capacity: filter.capacity,
      grid_interconnection: filter.grid_interconnection,
      off_taker: filter.off_taker,
      sector: filter.sector,
      labels: filter.labels,
      standard_compliance: filter.standard_compliance,
      country_code: filter.country && this.getCodeFromCountry(filter.country),
      commissioning_date:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),
    });
    const query: FindManyOptions<Device> = {
      where,
      order: {
        registrant_organisation_code: 'ASC',
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
}
