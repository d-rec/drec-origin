import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FindOneOptions, Repository, In, FindConditions, Any } from 'typeorm';

import axios from 'axios';
import {
  Aggregate,
  AggregatedReadDTO,
  AggregateFilterDTO,
  MeasurementDTO,
  ReadDTO,
  ReadsService as BaseReadService,
  Unit,
} from '@energyweb/energy-api-influxdb';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { DeviceService } from '../device/device.service';
import { OrganizationService } from '../organization/organization.service';
import { DateTime } from 'luxon';
import { BASE_READ_SERVICE } from './const';
import { EventBus } from '@nestjs/cqrs';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import { BigNumber } from 'ethers';
import { DeviceDTO } from '../device/dto';
import { DeviceGroupService } from '../device-group/device-group.service';
import { Intermediate_MeterRead } from './intermideate_meterread.entity';
import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { flattenDeep, values, groupBy, mean, sum } from 'lodash';
import { NewIntmediateMeterReadDTO, IntmediateMeterReadDTO } from './dto/intermediate_meter_read.dto';
import { Iintermediate, IAggregateintermediate } from '../../models'
import { InjectRepository } from '@nestjs/typeorm';

import { GetMarketplaceOrganizationHandler } from '@energyweb/origin-backend/dist/js/src/pods/organization/handlers/get-marketplace-organization.handler';
export type TUserBaseEntity = ExtendedBaseEntity & Iintermediate;
export type TUserBaseEntity1 = ExtendedBaseEntity & IAggregateintermediate;
@Injectable()
export class ReadsService {
  private readonly logger = new Logger(ReadsService.name);

  constructor(
    @InjectRepository(Intermediate_MeterRead) private readonly repository: Repository<Intermediate_MeterRead>,
    @InjectRepository(AggregateMeterRead) private readonly repository1: Repository<AggregateMeterRead>,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadService,
    private readonly deviceService: DeviceService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly organizationService: OrganizationService,
    private readonly eventBus: EventBus,

  ) { }

  public async getGroupAggregatedReads(
    groupId: number,
    filter: AggregateFilterDTO,
  ): Promise<AggregatedReadDTO[]> {
    const deviceGroup = await this.deviceGroupService.findById(groupId);
    if (!deviceGroup.devices?.length) {
      throw new NotFoundException(
        `No devices were found for group with id ${groupId}`,
      );
    }
    const allReads = flattenDeep(
      await Promise.all(
        deviceGroup.devices.map(
          async (device: DeviceDTO) =>
            await this.baseReadsService.aggregate(device.externalId, filter),
        ),
      ),
    );

    // Group all read which have same start and stop dates
    const readsGroupedBySameDates = values(
      groupBy(allReads, (read) => JSON.stringify([read.start, read.stop])),
    );

    const aggregatedReads = readsGroupedBySameDates.map(
      (group: AggregatedReadDTO[]): AggregatedReadDTO => {
        return {
          start: group[0].start,
          stop: group[0].stop,
          value: this.aggregateArray(
            filter.aggregate,
            group.map((item: AggregatedReadDTO) => item.value),
          ),
        };
      },
    );

    return aggregatedReads;
  }

  public async storeRead(
    id: string,
    measurements: MeasurementDTO,
  ): Promise<void> {
    this.logger.debug('DREC is storing smart meter reads:');
    this.logger.debug(JSON.stringify(measurements));
    console.log(measurements);
    const device = await this.deviceService.findReads(id);

    if (!device) {
      throw new NotFoundException(`No device found with external id ${id}`);
    }

    const roundedMeasurements = this.roundMeasurementsToUnit(measurements);
    console.log(roundedMeasurements);
    const filteredMeasurements = await this.filterMeasurements(
      id,
      roundedMeasurements,
      device,
    );
    console.log(filteredMeasurements);
    await this.storeGenerationReading(id, filteredMeasurements, device);
  }


  private async storeGenerationReading(
    id: string,
    measurements: MeasurementDTO,
    device: DeviceDTO,
  ): Promise<void> {
    const organization = await this.organizationService.findOne(
      device.organizationId,
    );
    console.log('109')
    if (!organization) {
      throw new NotFoundException(
        `No organization found with device organization code ${device.organizationId}`,
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
          deviceId: id,
          energyValue: BigNumber.from(measurement.value),
          fromTime: startTime,
          toTime: endTime,
          organizationId: organization.id.toString(),
        }),
      );
    }
  }

  private async store(id: string, measurements: MeasurementDTO): Promise<void> {
    console.log("137")
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
    measurement: MeasurementDTO,
    device: DeviceDTO,
  ): Promise<MeasurementDTO> {
    const final = await this.getLatestRead(id);
    console.log(final);

    console.log("final173");
    if (!final || !device) {
      return measurement;
    } else {
      return {
        reads: measurement.reads.filter((read: ReadDTO) =>
          this.validateEnergy(read, final, device),
        ),
        unit: measurement.unit,
      };
    }
  }

  private async getLatestRead(meterId: string): Promise<ReadDTO | void> {
    try {
      return await this.baseReadsService.findLatestRead(meterId);
    } catch (e) {
      this.logger.warn(e.message);
      return;
    }
  }

  private validateEnergy(
    read: ReadDTO,
    final: ReadDTO,
    device: DeviceDTO,
  ): boolean {
    const computeMaxEnergy = (
      capacity: number,
      meteredTimePeriod: number,
      deviceAge: number,
      degradation: number,
      yieldValue: number,
    ) => {
      // Max calculated energy formula = Device capacity [kW] * metered time period [h] * device age [years] * degradation [%/year] * yield [kWh/kW]
      return (
        capacity * meteredTimePeriod * deviceAge * degradation * yieldValue
      );
    };
    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity; // W
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    const deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    const currentRead = DateTime.fromISO(read.timestamp.toISOString());
    const lastRead = DateTime.fromISO(final.timestamp.toISOString());
    this.logger.debug(`Current Date: ${DateTime.now()}`);
    this.logger.debug(`Current read: ${read.timestamp}`);
    this.logger.debug(`Last read: ${final.timestamp}`);
    const meteredTimePeriod = Math.abs(
      currentRead.diff(lastRead, ['hours']).toObject()?.hours || 0,
    ); // hours
    const margin = 0.2; // Margin for comparing read value with computed max energy
    const maxEnergy = computeMaxEnergy(
      capacity,
      meteredTimePeriod,
      deviceAge,
      degradation,
      yieldValue,
    );
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${degradation}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(`${read.value + margin * read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
    );
    return Math.round(read.value + margin * read.value) < maxEnergy;
  }
  async findOne(conditions: FindConditions<Intermediate_MeterRead>): Promise<TUserBaseEntity> {
    const leatestvalue = await (this.repository.findOne(conditions
    ) as Promise<Iintermediate> as Promise<TUserBaseEntity>);

    console.log(leatestvalue);
    return leatestvalue;
  }

  async findOne1(conditions: FindConditions<AggregateMeterRead>): Promise<TUserBaseEntity1> {
    console.log(conditions);
    const leatestvalue = await (this.repository1.findOne(conditions,
    ) as Promise<IAggregateintermediate> as Promise<TUserBaseEntity1>);

    console.log("leatestvalue");
    console.log(leatestvalue);
    return leatestvalue;
  }
  public async findlastRead(deviceId: string): Promise<AggregateMeterRead[]> {
    const leatestvalue = await this.repository1.find({
      where: { deviceId },
      order: {
        id: 'DESC',
      },
      take: 1
    });
    return leatestvalue;
  }

  // new meter read process
  public async newstoreRead(
    id: string,
    measurements: NewIntmediateMeterReadDTO,
  ): Promise<void> {
    this.logger.debug('DREC is storing smart meter reads:');
    this.logger.debug(JSON.stringify(measurements));
    console.log(measurements);
    const device = await this.deviceService.findReads(id);
    console.log(measurements);
    console.log(new Date(measurements.reads[0].endtimestamp));
    console.log(new Date(Date.now()));
    if (!device) {
      throw new NotFoundException(`No device found with external id ${id}`);
    }
    // if((measurements.type==='Delta'&& new Date(measurements.reads[0].endtimestamp)!= new Date(Date.now()))|| (measurements.type ==='Aggregate'&& new Date(measurements.reads[0].endtimestamp)!= new Date(Date.now()))){
    //   throw new NotFoundException(`Previous date is only allowed in Historic Reads. `);
    // }

    const roundedMeasurements = this.newroundMeasurementsToUnit(measurements);
    console.log(roundedMeasurements);
    const filteredMeasurements = await this.newfilterMeasurements(
      id,
      roundedMeasurements,
      device,
    );
    console.log(filteredMeasurements);
    await this.newstoreGenerationReading(id, filteredMeasurements, device);
  }


  private newroundMeasurementsToUnit(measurement: NewIntmediateMeterReadDTO): NewIntmediateMeterReadDTO {
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
        starttimestamp: r.starttimestamp,
        endtimestamp: r.endtimestamp,
        value: Math.round(r.value * multiplier),
      })),
      unit: Unit.Wh,
      type: measurement.type,
      
    };
  }

  private async newfilterMeasurements(
    deviceId: string,
    measurement: NewIntmediateMeterReadDTO,
    device: DeviceDTO,
  ): Promise<MeasurementDTO> {
    const final = await this.newgetLatestRead(deviceId);
    let reads: any = [];
    console.log(final);
    //let newmeasurement={} ;
    const devicetype = await this.repository.findOne({deviceId})
    if (measurement.type === "History") {

    }
    else if (measurement.type === 'Delta') {
      if (!final || !device) {
        await this.repository.save({
          unit: measurement.unit,
          type: measurement.type,
          deviceId: deviceId
        })
      } else {

        if (devicetype?.type != measurement.type) {
          throw new NotFoundException(`This device not used for type  ${measurement.type}`);

        }

      }
      measurement.reads.forEach((element) => {

        reads.push({
          timestamp: new Date(element.endtimestamp),
          value: element.value
        })

      });
    }
    else if (measurement.type === 'Aggregate') {
      if (!final || !device) {
        await this.repository.save({
          unit: measurement.unit,
          type: measurement.type,
          deviceId: deviceId
        })
        measurement.reads.forEach(async (element) => {
          // insert in intermidiate Table
          console.log(element)
          const lastvalue = await this.findlastRead(deviceId);

          var Delta;
          if (lastvalue.length > 0) {
            Delta = Math.abs(element.value - lastvalue[0].value);
          } else {

            Delta = element.value;
          }

          reads.push({
            timestamp: new Date(element.endtimestamp),
            value: Delta
          })
          await this.repository1.save({

            value: element.value,
            deltaValue: Delta,
            deviceId: deviceId,
            unit: measurement.unit,
            datetime: element.endtimestamp.toString()

          });

        })
      } else {

        if (devicetype?.type != measurement.type) {
          throw new NotFoundException(`This device not used for type  ${measurement.type}`);

        }
        measurement.reads.forEach(async (element) => {
          const lastvalue = await this.findlastRead(deviceId);
          var Delta;
          if (lastvalue.length > 0) {
            Delta = Math.abs(element.value - lastvalue[0].value);
          } else {
            Delta = element.value;
          }
          reads.push({
            timestamp: new Date(element.endtimestamp),
            value: Delta
          })
          await this.repository1.save({
            value: element.value,
            deltaValue: Delta,
            deviceId: deviceId,
            unit: measurement.unit,
            datetime: element.endtimestamp.toString()

          });

        })
      }
    }

    if (!final || !device) {

      return {
        reads: reads,
        unit: measurement.unit
      }
    }
    else {

      return {
        reads: reads.filter((read: ReadDTO) =>
          this.newvalidateEnergy(read, final, device),
        ),
        unit: measurement.unit,

      };
    }

  }
  private async GetReadsTypes(
    id: string,
    measurement: NewIntmediateMeterReadDTO,

  ): Promise<ReadDTO> {


    let reads: any = [];
    if (measurement.type === "History") {



    }
    else if (measurement.type === 'Delta') {


    }
    else if (measurement.type === 'Aggregate') {

      measurement.reads.forEach(async (element) => {
        // insert in intermidiate Table
        console.log(element)
        const lastvalue = await this.findlastRead(id);

        var Delta;
        if (lastvalue.length > 0) {
          Delta = Math.abs(element.value - lastvalue[0].value);
        } else {
          Delta = element.value;
        }

        reads.push({
          timestamp: new Date(element.endtimestamp),
          value: Delta
        })
        await this.repository1.save({

          value: element.value,
          deltaValue: Delta,
          deviceId: id,
          unit: measurement.unit,
          datetime: element.endtimestamp.toString()

        });

      })
    }
    return reads;
  }
  private async newgetLatestRead(meterId: string): Promise<ReadDTO | void> {
    try {
      return await this.baseReadsService.findLatestRead(meterId);
    } catch (e) {
      this.logger.warn(e.message);
      return;
    }
  }



  private newvalidateEnergy(
    read: ReadDTO,
    final: ReadDTO,
    device: DeviceDTO,

  ): boolean {
    const computeMaxEnergy = (
      capacity: number,
      meteredTimePeriod: number,
      deviceAge: number,
      degradation: number,
      yieldValue: number,
    ) => {
      // Max calculated energy formula = Device capacity [kW] * metered time period [h] * device age [years] * degradation [%/year] * yield [kWh/kW]
      return (
        capacity * meteredTimePeriod * deviceAge * degradation * yieldValue
      );
    };
    console.log("newvalidateEnergy")
    this.logger.debug(JSON.stringify(read));
    this.logger.debug(JSON.stringify(final));
    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity; // W
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    const deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    const currentRead = DateTime.fromISO(read.timestamp.toISOString());
    const lastRead = DateTime.fromISO(final.timestamp.toISOString());
    this.logger.debug(`Current Date: ${DateTime.now()}`);
    this.logger.debug(`Current read: ${read.timestamp}`);
    this.logger.debug(`Last read: ${final.timestamp}`);
    const meteredTimePeriod = Math.abs(
      currentRead.diff(lastRead, ['hours']).toObject()?.hours || 0,
    ); // hours

    const margin = 0.2; // Margin for comparing read value with computed max energy
    const maxEnergy = computeMaxEnergy(
      capacity,
      meteredTimePeriod,
      deviceAge,
      degradation,
      yieldValue,
    );

    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${degradation}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(`${read.value + margin * read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
    );
    console.log(Math.round(read.value + margin * read.value) < maxEnergy)
    return Math.round(read.value + margin * read.value) < maxEnergy;
  }


  private async newstoreGenerationReading(
    id: string,
    measurements: MeasurementDTO,
    device: DeviceDTO,
  ): Promise<void> {
    const organization = await this.organizationService.findOne(
      device.organizationId,
    );

    if (!organization) {
      throw new NotFoundException(
        `No organization found with device organization code ${device.organizationId}`,
      );
    }

    console.log("new store")
    await this.store(id, measurements);

    for (const measurement of measurements.reads) {
      const startTime = DateTime.fromJSDate(measurement.timestamp)
        .minus({ minutes: 30 })
        .toJSDate();
      const endTime = DateTime.fromJSDate(measurement.timestamp).toJSDate();

      this.eventBus.publish(
        new GenerationReadingStoredEvent({
          deviceId: id,
          energyValue: BigNumber.from(measurement.value),
          fromTime: startTime,
          toTime: endTime,
          organizationId: organization.id.toString(),
        }),
      );
    }
  }

  private aggregateArray(aggregate: Aggregate, array: number[]): number {
    switch (aggregate) {
      case Aggregate.Mean:
        return Math.floor(mean(array));
      case Aggregate.Sum:
        return Math.floor(sum(array));
    }
  }
}

