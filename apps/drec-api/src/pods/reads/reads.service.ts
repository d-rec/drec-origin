import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  MeasurementDTO,
  ReadDTO,
  FilterDTO,
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
import { DeviceDTO } from '../device/dto';

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

    if (!device) {
      throw new NotFoundException(`No device found with id ${id}`);
    }

    const filteredMeasurements = await this.filterMeasurements(
      id,
      measurements,
      device,
    );

    console.log('Filtered measurements: ', filteredMeasurements);

    const roundedMeasurements =
      this.roundMeasurementsToUnit(filteredMeasurements);
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

  private async filterMeasurements(
    id: string,
    measurements: MeasurementDTO,
    device: DeviceDTO,
  ): Promise<MeasurementDTO> {
    const final = await this.getFinalRead(id);
    if (!final || !device) {
      return measurements;
    }
    return {
      reads: measurements.reads.filter((read: ReadDTO) =>
        this.validateEnergy(read, final, device),
      ),
      unit: Unit.Wh,
    };
  }

  // This will be changed - just for testing
  private async getFinalRead(meterId: string): Promise<ReadDTO> {
    const filer: FilterDTO = {
      limit: 10000,
      offset: 0,
      start: '2020-01-01T00:00:00Z',
      end: '2020-01-02T00:00:00Z',
    };
    const final = await this.baseReadsService.find(meterId, filer);
    return final[0];
  }

  private validateEnergy(
    read: ReadDTO,
    final: ReadDTO,
    device: DeviceDTO,
  ): boolean {
    const degradation = 0.5; // [%/year]
    const yieldValue = device.yield_value || 1000; // [kWh/kW]
    const capacity = device.capacity; // Kw

    const commissioningDate = DateTime.fromISO(device.commissioning_date);
    const today = new Date();
    const currentDate = DateTime.fromISO(today.toISOString());
    const deviceAge = Math.round(
      currentDate.diff(commissioningDate, ['years']).toObject().years,
    ); // years

    const currentRead = DateTime.fromISO(read.timestamp.toISOString());
    const lastRead = DateTime.fromISO(final.timestamp.toISOString());
    const meteredTimePeriod = Math.round(
      currentRead.diff(lastRead, ['hours']).toObject().hours,
    ); // years

    const margin = 0.2;

    const maxEnergy = this.computeMaxEnergy(
      capacity,
      meteredTimePeriod,
      deviceAge,
      degradation,
      yieldValue,
    );
    console.log('Validation: ', read.value + margin * read.value < maxEnergy);
    return read.value + margin * read.value < maxEnergy;
  }

  private computeMaxEnergy(
    capacity: number,
    meteredTimePeriod: number,
    deviceAge: number,
    degradation: number,
    yieldValue: number,
  ): number {
    // Max calculated energy formula = Device capacity [kW] * metered time period [h] * device age [years] * degradation [%/year] * yield [kWh/kW]
    return capacity * meteredTimePeriod * deviceAge * degradation * yieldValue;
  }
}
