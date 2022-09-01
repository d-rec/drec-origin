import { Inject, Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
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
//import { Intermediate_MeterRead } from './intermideate_meterread.entity';
import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { flattenDeep, values, groupBy, mean, sum } from 'lodash';
import { NewIntmediateMeterReadDTO, IntmediateMeterReadDTO } from './dto/intermediate_meter_read.dto';
import { Iintermediate, IAggregateintermediate } from '../../models'
import { InjectRepository } from '@nestjs/typeorm';
import { InfluxDB, FluxTableMetaData } from '@influxdata/influxdb-client'

import { GetMarketplaceOrganizationHandler } from '@energyweb/origin-backend/dist/js/src/pods/organization/handlers/get-marketplace-organization.handler';
import { ReadStatus } from 'src/utils/enums';
export type TUserBaseEntity = ExtendedBaseEntity & IAggregateintermediate;

@Injectable()
export class ReadsService {
  private readonly logger = new Logger(ReadsService.name);

  constructor(
    @InjectRepository(AggregateMeterRead) private readonly repository: Repository<AggregateMeterRead>,

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
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    if (deviceAge == 0) {
      deviceAge = 1;
    }
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


  public findlastRead(deviceId: string): Promise<AggregateMeterRead[]> {
    return this.repository.find({
      where: { deviceId },
      order: {
        id: 'DESC',
      },
      take: 1
    });

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
    if (!device) {
      throw new NotFoundException(`No device found with external id ${id}`);
    }

    const roundedMeasurements = this.NewroundMeasurementsToUnit(measurements);

    const filteredMeasurements = await this.NewfilterMeasurements(
      id,
      roundedMeasurements,
      device,
    );
    console.log(filteredMeasurements);
    await this.newstoreGenerationReading(id, filteredMeasurements, device);
  }


  private NewroundMeasurementsToUnit(measurement: NewIntmediateMeterReadDTO): NewIntmediateMeterReadDTO {
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

  private async NewfilterMeasurements(
    deviceId: string,
    measurement: NewIntmediateMeterReadDTO,
    device: DeviceDTO,
  ): Promise<MeasurementDTO> {
    //@ts-ignore
    const final = await this.NewfindLatestRead(deviceId, device.createdAt);

    let reads: any = [];

    if (measurement.type === "History") {
      await new Promise((resolve, reject) => {
        measurement.reads.forEach(async (element, measurmentreadindex) => {

          const requeststartdate = DateTime.fromISO(new Date(element.starttimestamp).toISOString());
          const requestcurrentend = DateTime.fromISO(new Date(element.endtimestamp).toISOString());
          const meteredTimePeriod = Math.abs(
            requeststartdate.diff(requestcurrentend, ['hours']).toObject()?.hours || 0,
          );
          //@ts-ignore
          const historyAge = new Date(device.createdAt);
          historyAge.setFullYear(historyAge.getFullYear() - 1);
          console.log("historyAge");
          console.log(historyAge);
          console.log("createdAt");
          //@ts-ignore
          console.log(new Date(device?.createdAt));
          console.log("starttimestamp");
          console.log(new Date(element.starttimestamp));
        
          console.log("endtimestamp");
          console.log(new Date(element.endtimestamp));
        
          //@ts-ignore
          if (new Date(device?.createdAt).toLocaleDateString() < new Date(element.starttimestamp).toLocaleDateString() && new Date(device.createdAt).toLocaleDateString() < new Date(element.endtimestamp).toLocaleDateString()) {
            reject(
              new ConflictException({
                success: false,
                message: `For History Type Reads of devices start time and/or end time should be  before of device onboarding `

              }),
            );
            // throw new NotFoundException(`it can not bs added after devcie registration for ${measurement.type}`);

          }
          //@ts-ignore
          if (requeststartdate <= DateTime.fromISO(new Date(historyAge).toISOString()) ||
            //@ts-ignore
            requeststartdate >= DateTime.fromISO(new Date(device?.createdAt).toISOString()) ||
            requestcurrentend <= DateTime.fromISO(new Date(historyAge).toISOString()) ||
            //@ts-ignore
            requestcurrentend >= DateTime.fromISO(new Date(device?.createdAt).toISOString())) {

            reject(
              new ConflictException({
                success: false,
                //@ts-ignore
                message: `For History Type Reads of devices start time and/or end time should be within 1 year of device onboarding, ex: device onboarded date: ${device?.createdAt}maximum date allowed for start and end date should be within one year in past from onboarded date, ${device?.createdAt}`

              }),
            );
          }

          reads.push({
            timestamp: new Date(element.endtimestamp),
            value: element.value,
            timeperiod: meteredTimePeriod
          });

          if (measurmentreadindex == measurement.reads.length - 1) {

            resolve(true);
          }

        })
      });

    }
    else if (measurement.type === 'Delta') {

      if (!final || !device) {

        await this.deviceService.updatereadtype(deviceId, measurement.type);
      } else {

        if (device?.meterReadtype != measurement.type) {
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
        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {
            console.log(element.endtimestamp);
            console.log(new Date(element.endtimestamp).toLocaleDateString());
            console.log(new Date(Date.now()).toLocaleDateString());
            console.log(device.createdAt);
            //@ts-ignore
            if (element.endtimestamp < device.createdAt) {
              reject(
                new ConflictException({
                  success: false,
                  message:
                    'For Aggregate Type Reads of devices end time is lesser then from device onboarding'

                }),
              );

            }

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
            await this.repository.save({
              value: element.value,
              deltaValue: Delta,
              deviceId: deviceId,
              unit: measurement.unit,
              datetime: element.endtimestamp.toString()

            });
            if (measurmentreadindex == measurement.reads.length - 1) {

              resolve(true);
            }

          })
        });
        await this.deviceService.updatereadtype(deviceId, measurement.type);

      } else {
        if (device?.meterReadtype != measurement.type && device?.meterReadtype != null) {
          throw new NotFoundException(`This device not used for type  ${measurement.type}`);

        }

        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {
            if (new Date(element.endtimestamp).toLocaleDateString() != new Date(Date.now()).toLocaleDateString()) {
              reject(
                new ConflictException({
                  success: false,
                  message:
                    'Previous date is only allowed in Historic Reads.'

                }),
              );

            }
            const lastvalue = await this.findlastRead(deviceId);

            var Delta;
            if (lastvalue.length > 0) {
              Delta = Math.abs(element.value - lastvalue[0].value);
              if (Delta === 0) {
                reject(
                  new ConflictException({
                    success: false,
                    message:
                      'Invaild Value,This read alredy added'

                  }),
                );
              }
            } else {
              Delta = element.value;
            }
            reads.push({
              timestamp: new Date(element.endtimestamp),
              value: Delta
            })
            await this.repository.save({
              value: element.value,
              deltaValue: Delta,
              deviceId: deviceId,
              unit: measurement.unit,
              datetime: element.endtimestamp.toString()

            });
            if (measurmentreadindex == measurement.reads.length - 1) {

              resolve(true);
            }
          })
        });

      }

    }
    if (!final || !device) {
      if (measurement.type === "History") {
        return {
          reads: reads.filter((read: any) =>
            this.NewhistoryvalidateEnergy(read, device, read.timeperiod)
          ),
          unit: measurement.unit,

        };
      } else {

        return {
          reads: reads.filter((read: ReadDTO) =>
            this.firstvalidateEnergy(read, device),
          ),
          unit: measurement.unit
        }
      }
    }
    else {
      if (measurement.type === "History") {

        return {
          reads: reads.filter((read: any) =>

            this.NewhistoryvalidateEnergy(read, device, read.timeperiod)
          ),
          unit: measurement.unit,
        };
      } else {
        return {
          reads: reads.filter((read: ReadDTO) =>
            this.NewvalidateEnergy(read, final, device),
          ),
          unit: measurement.unit,
        };
      }
    }

  }

  // private async newgetLatestRead(meterId: string): Promise<ReadDTO | void> {
  //   try {
  //     return await this.baseReadsService.findLatestRead(meterId);
  //   } catch (e) {
  //     this.logger.warn(e.message);
  //     return;
  //   }
  // }
  private async NewfindLatestRead(meterId: string, deviceregisterdate: Date): Promise<ReadDTO | void> {
    console.log("527")
    console.log(deviceregisterdate)
    //const regisdate = DateTime.fromISO(deviceregisterdate.toISOString());

    //@ts-ignore
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${deviceregisterdate}, stop: now())
    |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
    |> last()`

    console.log('*** QUERY ROWS ***')
    console.log(fluxQuery)
    const reads = await this.execute(fluxQuery);
    console.log("reads[0]")
    console.log(reads[0])

    return reads[0];


  }
  async execute(query: any) {

    const data = await this.dbReader.collectRows(query);
    return data.map((record: any) => ({
      timestamp: new Date(record._time),
      value: Number(record._value),
    }));
  }
  get dbReader() {
    // const url = 'http://localhost:8086';
    // const token = 'admin:admin'
    // const org = '';

    //@ts-ignore
    const url = process.env.INFLUXDB_URL;
    //@ts-ignore
    const token = process.env.INFLUXDB_TOKEN;
    //@ts-ignore
    const org = process.env.INFLUXDB_ORG;

    //@ts-ignore
    return new InfluxDB({ url, token }).getQueryApi(org)
  }
  private firstvalidateEnergy(
    read: ReadDTO,
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
    this.logger.debug(JSON.stringify(read))
    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity; // W
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
      if(deviceAge ===0)
      {
        deviceAge = 1;
      }
    const currentRead = DateTime.fromISO(read.timestamp.toISOString());
    console.log(read.timestamp.toISOString());
    //@ts-ignore
    const lastRead = DateTime.fromISO(new Date(device.createdAt).toISOString());
    //@ts-ignore
    console.log(new Date(device.createdAt).toISOString());
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
  private NewvalidateEnergy(
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

    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity; // W
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    if(deviceAge ===0)
    {
      deviceAge=1;
    }
    const currentRead = DateTime.fromISO(read.timestamp.toISOString());
    const lastRead = DateTime.fromISO(final.timestamp.toISOString());

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

  private NewhistoryvalidateEnergy(
    read: ReadDTO,
    device: DeviceDTO,
    requestmeteredTimePeriod: number,

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
    this.logger.debug(JSON.stringify(read))
    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity; // W
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    if(deviceAge ===0)
    {
      deviceAge=1;
    }
    const meteredTimePeriod = requestmeteredTimePeriod;

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

