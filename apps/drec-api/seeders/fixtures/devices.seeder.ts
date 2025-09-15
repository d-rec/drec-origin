import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Device } from '../../src/pods/device/device.entity';
import { Organization } from '../../src/pods/organization/organization.entity';
import { DeviceTypeCode, FuelCode, OffTaker } from '../../src/utils/enums';

@Injectable()
export class DevicesSeeder {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,

    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async run(): Promise<void> {
    const developerEmail = process.env.DEVELOPER_EMAIL?.toLowerCase() || '';

    const developerOrg = await this.organizationRepository.findOne({
      where: { orgEmail: developerEmail },
    });

    if (!developerOrg) {
      console.error('Error: Organization not found for Developer.');
      return;
    }

    const devices = this.deviceRepository.create([
      {
        externalId: uuidv4(),
        organizationId: developerOrg.id,
        projectName: 'Project Alpha',
        address: '123 Main St, City A',
        latitude: '12.3456',
        longitude: '65.4321',
        countryCode: 'ALB',
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DeviceTypeCode.TC120,
        capacity: 1000.0,
        commissioningDate: '2023-01-01',
        gridInterconnection: true,
        offTaker: OffTaker.School,
        yieldValue: 2000,
        impactStory: 'Impact story for device 1',
        images: ['image1.jpg'],
        deviceDescription: null,
        energyStorage: false,
        energyStorageCapacity: null,
        qualityLabels: 'Quality Label 1',
        meterReadtype: null,
        timezone: 'UTC',
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: 'e0ab91a4-03bc-4447-9d00-c51260fd6ff9',
      },
      {
        externalId: uuidv4(),
        organizationId: developerOrg.id,
        projectName: 'Project Beta',
        address: '456 Elm St, City B',
        latitude: '34.5678',
        longitude: '78.9012',
        countryCode: 'ALB',
        fuelCode: FuelCode.ES100,
        deviceTypeCode: DeviceTypeCode.TC120,
        capacity: 2500.0,
        commissioningDate: '2023-02-01',
        gridInterconnection: false,
        offTaker: OffTaker.School,
        yieldValue: 2500,
        impactStory: 'Impact story for device 2',
        images: ['image2.jpg'],
        deviceDescription: null,
        energyStorage: true,
        energyStorageCapacity: 50.0,
        qualityLabels: 'Quality Label 2',
        meterReadtype: null,
        timezone: 'UTC',
        version: '1.0',
        IREC_Status: 'NotRegistered',
        IREC_ID: null,
        api_user_id: 'e0ab91a4-03bc-4447-9d00-c51260fd6ff0',
      },
    ]);

    await this.deviceRepository.save(devices);
  }
  async drop(): Promise<void> {
    await this.deviceRepository.delete({});
  }
}
