import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  MeasurementDTO,
  ReadsService as BaseReadService,
  Unit,
} from '@energyweb/energy-api-influxdb';
import { DeviceService } from '../device/device.service';
import { OrganizationService } from '../organization/organization.service';
import { DateTime } from 'luxon';
import { Device } from '../device/device.entity';
import { BASE_READ_SERVICE } from './const';
import { EventBus } from '@nestjs/cqrs';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import { BigNumber } from 'ethers';

@Injectable()
export class ReadsService {
  private readonly logger = new Logger(ReadsService.name);

  constructor(
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadService,
    private readonly deviceService: DeviceService,
    private readonly organizationService: OrganizationService,
    private readonly eventBus: EventBus,
  ) {}

  public async storeRead(
    id: string,
    measurements: MeasurementDTO,
  ): Promise<void> {
    this.logger.debug('DREC is storing smart meter reads:');
    this.logger.debug(JSON.stringify(measurements));

    const device = await this.deviceService.findOne(+id);
    const roundedMeasurements = this.roundMeasurementsToUnit(measurements);
    await this.storeGenerationReading(id, roundedMeasurements, device);
  }

  private async storeGenerationReading(
    id: string,
    measurements: MeasurementDTO,
    device: Device,
  ): Promise<void> {
    const organization = await this.organizationService.findOne(
      device.registrant_organisation_code,
    );

    if (!organization) {
      throw new NotFoundException(
        `No organization found with device organization code ${device.registrant_organisation_code}`,
      );
    }

    await this.store(id, measurements);

    for (const measurement of measurements.reads) {
      const startTime = DateTime.fromJSDate(measurement.timestamp)
        .minus({ minutes: 30 })
        .toJSDate();
      const endTime = DateTime.fromJSDate(measurement.timestamp).toJSDate();

      this.eventBus.publish(
        new GenerationReadingStoredEvent({
          deviceId: +id,
          energyValue: BigNumber.from(measurement.value),
          fromTime: startTime,
          toTime: endTime,
          organizationId: organization.code,
        }),
      );
    }
  }

  private async store(id: string, measurements: MeasurementDTO): Promise<void> {
    return await this.baseReadsService.store(id, measurements);
  }

  private roundMeasurementsToUnit(measurement: MeasurementDTO): MeasurementDTO {
    const getMultiplier = (unit: Unit) => {
      switch (unit) {
        case Unit.Wh:
          return 1;
        case Unit.kWh:
          return 10 ** 3;
        case Unit.MWh:
          return 10 ** 6;
        case Unit.GWh:
          return 10 ** 9;
      }
    };

    const multiplier = getMultiplier(measurement.unit);

    return {
      reads: measurement.reads.map((r) => ({
        timestamp: r.timestamp,
        value: Math.round(r.value * multiplier),
      })),
      unit: Unit.Wh,
    };
  }
}
