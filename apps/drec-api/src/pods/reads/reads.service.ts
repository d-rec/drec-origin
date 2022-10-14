import { Inject, Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { FindOneOptions, Repository, Brackets, SelectQueryBuilder, In, FindConditions, Any } from 'typeorm';

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
import { HistoryIntermediate_MeterRead } from './history_intermideate_meterread.entity';
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
    @InjectRepository(HistoryIntermediate_MeterRead) private readonly historyrepository: Repository<HistoryIntermediate_MeterRead>,
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
    const final = undefined;//await this.NewfindLatestRead(deviceId, device.createdAt);

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
            return reject(
              new ConflictException({
                success: false,
                message: `For History Type Reads of devices start time and/or end time should be  before of device onboarding `

              }),
            );

          }
          //@ts-ignore
          if (requeststartdate <= DateTime.fromISO(new Date(historyAge).toISOString()) ||
            //@ts-ignore
            requeststartdate >= DateTime.fromISO(new Date(device?.createdAt).toISOString()) ||
            requestcurrentend <= DateTime.fromISO(new Date(historyAge).toISOString()) ||
            //@ts-ignore
            requestcurrentend >= DateTime.fromISO(new Date(device?.createdAt).toISOString())) {

            return reject(
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
            timeperiod: meteredTimePeriod,
            startdate: requeststartdate,
            enddate: requestcurrentend
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

        if (device?.meterReadtype != measurement.type && device?.meterReadtype != null) {
          throw new NotFoundException(`In this device you can add read for ${device?.meterReadtype} type but you are sending  ${measurement.type}`);

        }

      }
      await new Promise((resolve, reject) => {
        measurement.reads.forEach((element, measurmentreadindex) => {
          if (final && final['timestamp']) {
            //@ts-ignore
            if (new Date(element.endtimestamp).getTime() < new Date(final.timestamp).getTime()) {
              return reject(
                new ConflictException({
                  success: false,
                  message:
                    //@ts-ignore
                    `The sent date for reading ${element.endtimestamp} is less than last sent mter read date ${final.timestamp}`

                }),
              );
            }
          }

          reads.push({
            timestamp: new Date(element.endtimestamp),
            value: element.value
          })
          if (measurmentreadindex == measurement.reads.length - 1) {
            resolve(true);
          }
        })
      });
    }
    else if (measurement.type === 'Aggregate') {
      if (!final) {
        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {
            const lastvalue = await this.findlastRead(deviceId);
            let Delta = 0;
            if (lastvalue.length > 0) {
              Delta = Math.abs(element.value - lastvalue[0].value);

              if (new Date(element.endtimestamp).getTime() < new Date(lastvalue[0].datetime).getTime() || element.value <= lastvalue[0].value) {
                return reject(
                  new ConflictException({
                    success: false,
                    message:
                      `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent mter read date/value ${lastvalue[0].datetime}/${lastvalue[0].value} `

                  }),
                );
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
            }
            else {
              await this.repository.save({
                value: element.value,
                deltaValue: Delta,
                deviceId: deviceId,
                unit: measurement.unit,
                datetime: element.endtimestamp.toString()

              });
            }
            if (measurmentreadindex == measurement.reads.length - 1) {
              resolve(true);
            }

          })
        });
        await this.deviceService.updatereadtype(deviceId, measurement.type);

      } else {
        if (device?.meterReadtype != measurement.type && device?.meterReadtype != null) {
          throw new NotFoundException(`In this device you can add read for ${device?.meterReadtype} type but you are sending  ${measurement.type}`);
        }

        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {

            const lastvalue = await this.findlastRead(deviceId);
            let Delta;
            if (lastvalue.length > 0) {
              Delta = Math.abs(element.value - lastvalue[0].value);
              if (new Date(element.endtimestamp).getTime() < new Date(lastvalue[0].datetime).getTime() || element.value <= lastvalue[0].value) {
                return reject(
                  new ConflictException({
                    success: false,
                    message:
                      `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent mter read date/value ${lastvalue[0].datetime}/${lastvalue[0].value} `

                  }),
                );
              }
              reads.push({
                timestamp: new Date(element.endtimestamp),
                value: Delta
              })
              //@ts-ignore
              await this.repository.save({
                value: element.value,
                deltaValue: Delta,
                deviceId: deviceId,
                unit: measurement.unit,
                datetime: element.endtimestamp

              });


            }
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
            this.NewhistoryvalidateEnergy(read, device, read.timeperiod, measurement, read.startdate, read.enddate)
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

            this.NewhistoryvalidateEnergy(read, device, read.timeperiod, measurement, read.startdate, read.enddate)

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
    if (deviceAge <= 0) {
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
    if (deviceAge <= 0) {
      deviceAge = 1;
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
    measurement: NewIntmediateMeterReadDTO,
    startdate: Date,
    enddate: Date
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
    if (deviceAge <= 0) {
      deviceAge = 1;
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

    if (Math.round(read.value + margin * read.value) < maxEnergy) {
      this.historyrepository.save({
        type: measurement.type,
        deviceId: device.externalId,
        unit: measurement.unit,
        readsvalue: read.value,
        readsStartDate: startdate,
        readsEndDate: enddate
      })
      return Math.round(read.value + margin * read.value) < maxEnergy;
    } else {
      throw new ConflictException({
        success: false,
        message: `${read.value + margin * read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
      });
    }

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
  public async getCheckHistoryCertificateIssueDateLogForDevice(deviceid: string,
    startDate: Date,
    endDate: Date): Promise<HistoryIntermediate_MeterRead[]> {
    const query = this.gethistorydevcielogFilteredQuery(deviceid,
      startDate,
      endDate);
      console.log("devicequery");
    try {

      const device = await query.getRawMany();
      console.log(device);
      const devices = device.map((s: any) => {
        const item: any = {
          id:s.devicehistory_id,
          readsStartDate: s.devicehistory_readsStartDate,
          readsEndDate: s.devicehistory_readsEndDate,
          readsvalue: s.devicehistory_readsvalue,
          deviceId: s.devicehistory_deviceId
        };
        return item;
      });

      return devices;
    } catch (error) {
      console.log(error)
      this.logger.error(`Failed to retrieve device`, error.stack);
      //  throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  private gethistorydevcielogFilteredQuery(deviceid: string,
    startDate: Date,
    endDate: Date): SelectQueryBuilder<HistoryIntermediate_MeterRead> {
    //  const { organizationName, status } = filterDto;
    const query = this.historyrepository
      .createQueryBuilder("devicehistory").
      where("devicehistory.deviceId = :deviceid", { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where(
            new Brackets((db1) => {
              db1.where("devicehistory.readsStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1", { reservationStartDate1: startDate, reservationEndDate1: endDate })
                .orWhere("devicehistory.readsStartDate = :reservationStartDate",{reservationStartDate:startDate})
            })
          )
            .andWhere(
              new Brackets((db2) => {
                db2.where("devicehistory.readsEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2", { reservationStartDate2: startDate, reservationEndDate2: endDate })
                  .orWhere("devicehistory.readsEndDate = :reservationEndDate ",{reservationEndDate :endDate})
              })
            )

        }),
      )
      .andWhere("devicehistory.certificate_issued != true")
    console.log(query.getQuery())
    return query;
  }

  async getDeviceHistoryCertificateIssueDate(
    conditions: FindConditions<HistoryIntermediate_MeterRead>,
  ): Promise<HistoryIntermediate_MeterRead | null> {
    return (await this.historyrepository.findOne(conditions)) ?? null;
  }
  async updatehistorycertificateissuedate(
    id: number,
    startdate: Date,
    enddate: Date,
  ): Promise<HistoryIntermediate_MeterRead> {
    // await this.checkNameConflict(data.name);
    const historydevice = await this.getDeviceHistoryCertificateIssueDate({ id: id });
    let updatedhistoryissue = new HistoryIntermediate_MeterRead();
    if (historydevice) {

      historydevice.certificate_issuance_startdate = startdate;
      historydevice.certificate_issuance_enddate = enddate;
      historydevice.certificate_issued=true;
      updatedhistoryissue = await this.historyrepository.save(historydevice);
    }
    return updatedhistoryissue;
  }
}

