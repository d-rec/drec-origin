import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Device } from '../../src/pods/device/device.entity';

@Injectable()
export class DevicesSeeder {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async run(): Promise<void> {
    // No standalone devices to seed.
  }

  async drop(): Promise<void> {
    await this.deviceRepository.delete({});
  }
}
