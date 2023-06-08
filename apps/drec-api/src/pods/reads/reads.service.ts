import { Inject, Injectable, Logger, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { FindOneOptions, Repository, Brackets, SelectQueryBuilder, In, FindConditions, Any } from 'typeorm';

import axios from 'axios';
import {
  Aggregate,
  AggregatedReadDTO,
  AggregateFilterDTO,
  MeasurementDTO,
  ReadDTO,
  FilterDTO,
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
import { flattenDeep, values, groupBy, mean, sum, head } from 'lodash';
import { NewIntmediateMeterReadDTO, IntmediateMeterReadDTO } from './dto/intermediate_meter_read.dto';
import { Iintermediate, NewReadDTO, IAggregateintermediate } from '../../models'
import { InjectRepository } from '@nestjs/typeorm';
import { GetMarketplaceOrganizationHandler } from '@energyweb/origin-backend/dist/js/src/pods/organization/handlers/get-marketplace-organization.handler';
import { ReadStatus } from 'src/utils/enums';
import { DeltaFirstRead } from './delta_firstread.entity'
import { HistoryNextInssuanceStatus } from '../../utils/enums/history_next_issuance.enum'
import { ReadFilterDTO } from './dto/filter.dto'
import * as mapBoxTimeSpace from '@mapbox/timespace';
import * as momentTimeZone from 'moment-timezone';
import { InfluxDB, QueryApi, } from '@influxdata/influxdb-client';

import { Cron, CronExpression } from '@nestjs/schedule';
import { response } from 'express';
import { EndReservationdateDTO } from '../device-group/dto';
import { timestamp } from 'rxjs/operators';
import { getFormattedOffSetFromOffsetAsJson, getLocalTime, getLocalTimeZoneFromDevice, getOffsetFromTimeZoneName } from '../../utils/localTimeDetailsForDevice';
import { log } from 'console';

export type TUserBaseEntity = ExtendedBaseEntity & IAggregateintermediate;

@Injectable()
export class ReadsService {
  private readonly logger = new Logger(ReadsService.name);
  // private influx: InfluxDB;
  //  private queryApi: QueryApi;
  private readonly influxDB: InfluxDB;
  private readonly queryApi: QueryApi;
  constructor(
    @InjectRepository(AggregateMeterRead) private readonly repository: Repository<AggregateMeterRead>,
    @InjectRepository(HistoryIntermediate_MeterRead) private readonly historyrepository: Repository<HistoryIntermediate_MeterRead>,
    @InjectRepository(DeltaFirstRead) private readonly deltarepository: Repository<DeltaFirstRead>,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadService,
    private readonly deviceService: DeviceService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly organizationService: OrganizationService,
    private readonly eventBus: EventBus,

  ) {
    //@ts-ignore
    const url = process.env.INFLUXDB_URL;
    //@ts-ignore
    const token = process.env.INFLUXDB_TOKEN;
    //@ts-ignore
    const org = process.env.INFLUXDB_ORG;

    this.influxDB = new InfluxDB({ url, token });
    this.queryApi = this.influxDB.getQueryApi(org);
  }

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
    //console.log(measurements);
    const device = await this.deviceService.findReads(id);

    if (!device) {
      throw new NotFoundException(`No device found with external id ${id}`);
    }

    const roundedMeasurements = this.roundMeasurementsToUnit(measurements);
    //console.log(roundedMeasurements);
    const filteredMeasurements = await this.filterMeasurements(
      id,
      roundedMeasurements,
      device,
    );
    //console.log(filteredMeasurements);
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
    //console.log('109')
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
    //console.log("137")
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
      where: { externalId: deviceId },
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
    //console.log(measurements);
    //change function for find device info by developer externalid
    const device = await this.deviceService.findReads(id);
    if (!device) {
      throw new NotFoundException(`No device found with external id ${id}`);
    }


    if (device.timezone === null && measurements.timezone !== null && measurements.timezone !== undefined && measurements.timezone.toString().trim() !== '') {
      await this.deviceService.updatetimezone(device.externalId, measurements.timezone);
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

          const checkhistroyreading = await this.checkhistoryreadexist(device.externalId, element.starttimestamp, element.endtimestamp);
          // console.log(checkhistroyreading)
          //@ts-ignore
          const historyAge = new Date(device.createdAt);
          historyAge.setFullYear(historyAge.getFullYear() - 3);
          console.log("historyAge");

          if (checkhistroyreading) {
            return reject(
              new ConflictException({
                success: false,
                message: `There are already one or more historical entries for this device which are conflicting current reading start date and/or end date `

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
                message: `For History Type Reads of devices start time and/or end time should be within 3 year of device onboarding, ex: device onboarded date: ${device?.createdAt}maximum date allowed for start and end date should be within 3 year in past from onboarded date, ${device?.createdAt}`

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
      return {
        reads: reads.filter((read: any) =>
          this.NewhistoryvalidateEnergy(read, device, read.timeperiod, measurement, read.startdate, read.enddate)
        ),
        unit: measurement.unit,

      };
    }
    else if (measurement.type === 'Delta') {

      if (!final) {
        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {
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
            let read: ReadDTO = {
              timestamp: new Date(element.endtimestamp),
              value: element.value
            }
            // if (deltafirstvalidation) {
            reads.push({
              timestamp: new Date(element.endtimestamp),
              value: element.value
            })
            await this.deltarepository.save({
              readsvalue: element.value,
              externalId: deviceId,
              unit: measurement.unit,
              readsEndDate: element.endtimestamp.toString()

            });
            // }

            if (measurmentreadindex == measurement.reads.length - 1) {
              resolve(true);
            }
          })
        });
        await this.deviceService.updatereadtype(deviceId, measurement.type);
        return {
          reads: reads,
          unit: measurement.unit
        }
      } else {

        if (device?.meterReadtype != measurement.type && device?.meterReadtype != null) {
          throw new NotFoundException(`In this device you can add read for ${device?.meterReadtype} type but you are sending  ${measurement.type}`);

        } else {
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
          return {
            reads: reads.filter((read: ReadDTO) =>
              this.NewvalidateEnergy(read, final, device),
            ),
            unit: measurement.unit,
          };

        }
      }

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

              let read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: Delta
              }
              const firstvalidation = this.firstvalidateEnergy(read, device)
              if (firstvalidation) {
                await this.repository.save({
                  value: element.value,
                  deltaValue: Delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString()

                });
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: Delta
                })
              }
            }
            else {
              let read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: element.value
              }
              const firstvalidation = this.firstvalidateEnergy(read, device)
              if (firstvalidation) {
                await this.repository.save({
                  value: element.value,
                  deltaValue: Delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString()

                });
              }
            }
            if (measurmentreadindex == measurement.reads.length - 1) {
              resolve(true);
            }
          })
        });
        await this.deviceService.updatereadtype(deviceId, measurement.type);
        return {
          reads: reads,
          unit: measurement.unit,
        };

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

              //@ts-ignore
              let read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: Delta
              }
              const newvalidation = this.NewvalidateEnergy(read, final, device);
              if (newvalidation) {
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: Delta
                })
                await this.repository.save({
                  value: element.value,
                  deltaValue: Delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString()

                });
              }

            }
            if (measurmentreadindex == measurement.reads.length - 1) {
              resolve(true);
            }
          })
        });

        return {
          reads: reads,
          unit: measurement.unit,
        };

      }
    }


    // if (!final) {
    //   if (measurement.type === "History") {
    //     return {
    //       reads: reads.filter((read: any) =>
    //         this.NewhistoryvalidateEnergy(read, device, read.timeperiod, measurement, read.startdate, read.enddate)
    //       ),
    //       unit: measurement.unit,

    //     };
    //   } 
    //   if (measurement.type === "History"){

    //   }
    //   else {


    //     return {
    //       reads: reads.filter((read: ReadDTO) =>
    //         this.firstvalidateEnergy(read, device),
    //       ),
    //       unit: measurement.unit
    //     }
    //   }
    // }
    // else {
    //   if (measurement.type === "History") {

    //     return {
    //       reads: reads.filter((read: any) =>

    //         this.NewhistoryvalidateEnergy(read, device, read.timeperiod, measurement, read.startdate, read.enddate)

    //       ),
    //       unit: measurement.unit,
    //     };
    //   } else {
    //     return {
    //       reads: reads.filter((read: ReadDTO) =>
    //         this.NewvalidateEnergy(read, final, device),
    //       ),
    //       unit: measurement.unit,
    //     };
    //   }
    // }

  }

  async NewfindLatestRead(meterId: string, deviceregisterdate: Date): Promise<ReadDTO | void> {

    //@ts-ignore
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${deviceregisterdate}, stop: now())
    |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
    |> last()`
    const reads = await this.execute(fluxQuery);
    return reads[0];
  }

  async findLastReadForMeterWithinRange(meterId: string, startdate: Date, enddate: Date): Promise<Array<{ timestamp: Date, value: number }>> {
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: ${startdate.getTime() / 1000}000000000, stop: ${enddate.getTime() / 1000}000000000)
      |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
      |> last()`;
    return await this.execute(fluxQuery);
  }

  async execute(query: any) {

    const data = await this.dbReader.collectRows(query);
    return data.map((record: any) => ({
      timestamp: new Date(record._time),
      value: Number(record._value),
    }));
  }
  get dbReader() {

    //@ts-ignore
    const url = process.env.INFLUXDB_URL;
    //@ts-ignore
    const token = process.env.INFLUXDB_TOKEN;
    //@ts-ignore
    const org = process.env.INFLUXDB_ORG;

    //@ts-ignore
    return new InfluxDB({ url, token }).getQueryApi(org)
  }

  private async checkhistoryreadexist(
    deviceid: string,
    startDate: Date,
    endDate: Date

  ): Promise<boolean> {
    const query = this.getexisthistorydevcielogFilteredQuery(deviceid,
      startDate,
      endDate);
    //console.log("historyexistdevicequery");
    try {

      const device = await query.getRawMany();

      return device.length > 0;
    } catch (error) {
      //console.log(error)
      this.logger.error(`Failed to retrieve device`, error.stack);
      //  throw new InternalServerErrorException('Failed to retrieve users');
    }

  }
  private getexisthistorydevcielogFilteredQuery(deviceid: string,
    startDate: Date,
    endDate: Date): SelectQueryBuilder<HistoryIntermediate_MeterRead> {
    console.log(startDate);
    console.log(endDate);

    //  const { organizationName, status } = filterDto;
    const query = this.historyrepository
      .createQueryBuilder("devicehistory").
      where("devicehistory.externalId = :deviceid", { deviceid: deviceid })
      .andWhere(

        new Brackets((db) => {
          db.where("devicehistory.readsStartDate BETWEEN :startDateFirstWhere AND :endDateFirstWhere ", { startDateFirstWhere: startDate, endDateFirstWhere: endDate })
            .orWhere("devicehistory.readsEndDate BETWEEN :startDateSecondtWhere AND :endDateSecondWhere", { startDateSecondtWhere: startDate, endDateSecondWhere: endDate })
            .orWhere(":startdateThirdWhere BETWEEN devicehistory.readsStartDate AND devicehistory.readsEndDate", { startdateThirdWhere: startDate })
            .orWhere(":enddateforthdWhere BETWEEN devicehistory.readsStartDate AND devicehistory.readsEndDate", { enddateforthdWhere: endDate })

        }),
      )

    //console.log(query.getQuery())
    return query;
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
    //console.log("newvalidateEnergy")
    this.logger.debug(JSON.stringify(read))
    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity * 1000; // capacity in KilloWatt and read in Wh so coverting in Watt
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    if (deviceAge <= 0) {
      deviceAge = 1;
    }
    const currentRead = DateTime.fromISO(read.timestamp.toISOString());

    //console.log(read.timestamp.toISOString());
    //@ts-ignore
    const lastRead = DateTime.fromISO(new Date(device.createdAt).toISOString());
    //@ts-ignore
    //console.log(new Date(device.createdAt).toISOString());
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
    //console.log(Math.round(read.value + margin * read.value) < maxEnergy)
    if (Math.round(read.value + margin * read.value) < maxEnergy) {

      return Math.round(read.value + margin * read.value) < maxEnergy;
    } else {
      throw new ConflictException({
        success: false,
        message: `${read.value + margin * read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
      });
    }
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
    //console.log("newvalidateEnergy")

    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity * 1000; // capacity in KilloWatt and read in Wh so coverting in Watt
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
    //console.log(Math.round(read.value + margin * read.value) < maxEnergy)
    if (Math.round(read.value + margin * read.value) < maxEnergy) {

      return Math.round(read.value + margin * read.value) < maxEnergy;
    } else {
      throw new ConflictException({
        success: false,
        message: `${read.value + margin * read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
      });
    }

    // return Math.round(read.value + margin * read.value) < maxEnergy;
  }

  async NewhistoryvalidateEnergy(
    read: ReadDTO,
    device: DeviceDTO,
    requestmeteredTimePeriod: number,
    measurement: NewIntmediateMeterReadDTO,
    startdate: Date,
    enddate: Date
  ): Promise<boolean> {
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

    this.logger.debug(JSON.stringify(read))
    const degradation = 0.5; // [%/year]
    const yieldValue = device.yieldValue || 1500; // [kWh/kW]
    const capacity = device.capacity * 1000; // capacity in KilloWatt and read in Wh so coverting in Watt 
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
    //console.log(Math.round(read.value + margin * read.value) < maxEnergy)
    if (Math.round(read.value + margin * read.value) < maxEnergy) {
      this.historyrepository.save({
        type: measurement.type,
        externalId: device.externalId,
        unit: measurement.unit,
        readsvalue: read.value,
        readsStartDate: startdate,
        readsEndDate: enddate
      })
      console.log("1267");
      if (device.groupId != null) {
        const historynextissue = await this.deviceGroupService.getNextHistoryissuanceDevicelogafterreservation(
          device.externalId,
          device.groupId
        );
        console.log("historynextissue");
        if (historynextissue != undefined) {
          let stdate = new Date(startdate).getTime();
          let eddate = new Date(enddate).getTime();
          //@ts-ignore
          let reservSdate = new Date(historynextissue.reservationStartDate).getTime();
          console.log(reservSdate);
          //@ts-ignore
          let reservEdate = new Date(historynextissue.reservationEndDate).getTime();
          console.log(reservEdate);
          console.log((stdate >= reservSdate && stdate < reservEdate));
          console.log(eddate <= reservEdate && eddate > reservSdate);
          if ((stdate >= reservSdate && stdate < reservEdate) && (eddate <= reservEdate && eddate > reservSdate)) {
            //@ts-ignore
            this.deviceGroupService.HistoryUpdatecertificateissuedate(historynextissue.id, HistoryNextInssuanceStatus.Pending);
          }

        }

      }
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

    //console.log("new store")
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
    //console.log("devicequery");
    try {

      const device = await query.getRawMany();
      // console.log(device);
      const devices = device.map((s: any) => {
        const item: any = {
          id: s.devicehistory_id,
          readsStartDate: s.devicehistory_readsStartDate,
          readsEndDate: s.devicehistory_readsEndDate,
          readsvalue: s.devicehistory_readsvalue,
          externalId: s.devicehistory_externalId
        };
        return item;
      });

      return devices;
    } catch (error) {
      //console.log(error)
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
      where("devicehistory.externalId = :deviceid", { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where(
            new Brackets((db1) => {
              db1.where("devicehistory.readsStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1", { reservationStartDate1: startDate, reservationEndDate1: endDate })
                .orWhere("devicehistory.readsStartDate = :reservationStartDate", { reservationStartDate: startDate })
            })
          )
            .andWhere(
              new Brackets((db2) => {
                db2.where("devicehistory.readsEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2", { reservationStartDate2: startDate, reservationEndDate2: endDate })
                  .orWhere("devicehistory.readsEndDate = :reservationEndDate ", { reservationEndDate: endDate })
              })
            )

        }),
      )
      .andWhere("devicehistory.certificate_issued != true")
    // //console.log(query.getQuery())
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
      historydevice.certificate_issued = true;
      updatedhistoryissue = await this.historyrepository.save(historydevice);
    }
    return updatedhistoryissue;
  }
  async getAggregateMeterReadsFirstEntryOfDevice(meterId: string): Promise<AggregateMeterRead[]> {

    return this.repository.find({
      where: {
        externalId: meterId
      },
      take: 1
    })


  }
  // add new function for Delta firstread filter
  async getDeltaMeterReadsFirstEntryOfDevice(meterId: string): Promise<DeltaFirstRead[]> {

    return this.deltarepository.find({
      where: {
        externalId: meterId
      }
    })
  }

  /* */

  timeOffset: any;
  async getAllRead(externalId, filter, deviceOnboarded, pageNumber: number): Promise<any> {
    if (new Date(filter.start).getTime() == new Date(filter.end).getTime()) {
      throw new HttpException('The given start and end timestamps are the same', 400)
    }
    let historyread = [];
    let ongoing = [];
    let finalongoing = [];
    console.log("page number:::::::::::::::::::::::::::::::::::::::::::" + pageNumber)

    let sizeOfPage = 5;
    let numberOfPages = 0;
    let numberOfHistReads = await this.getnumberOfHistReads(externalId, filter.start, filter.end);
    let numberOfOngReads = 0;
    let numberOfReads = numberOfHistReads + numberOfOngReads;
    if (numberOfHistReads > 0) {
      numberOfPages = Math.ceil(numberOfHistReads / sizeOfPage);
    }
    //@ts-ignore

    if (typeof pageNumber === 'number' && !isNaN(pageNumber)) {
      filter.offset = sizeOfPage * (pageNumber - 1);
      filter.limit = sizeOfPage;
    }
    numberOfOngReads = await this.getnumberOfOngReads(filter.start, filter.end, externalId, deviceOnboarded);
    console.log(numberOfOngReads);
    if (numberOfOngReads > numberOfHistReads) {
      numberOfPages = Math.ceil(numberOfOngReads / sizeOfPage);
    }
    numberOfReads = numberOfHistReads + numberOfOngReads;
    // numberOfPages=Math.ceil(numberOfReads/sizeOfPage)
    if (numberOfHistReads == 0 && numberOfOngReads == 0) {

      return { historyread, ongoing, "numberOfReads": numberOfReads, "numberOfPages": 0, "currentPageNumber": 0 }
    }
    if ((typeof pageNumber === 'number' && !isNaN(pageNumber)) && pageNumber > numberOfPages) {

      return { historyread, ongoing, "numberOfReads": numberOfReads, "numberOfPages": numberOfPages, "currentPageNumber": 1 };
    }

    //if ((new Date(filter.start).getTime() <= new Date(deviceOnboarded).getTime() && new Date(filter.end).getTime() <= new Date(deviceOnboarded).getTime()) || (filter.start <= device_onboarded && filter.end > device_onboarded)) {

    if (new Date(filter.start).getTime() <= new Date(deviceOnboarded).getTime()) {

      const query = await this.getexisthistorydevcielogFilteredQuery(externalId, filter.start, filter.end);

      console.log("history query executed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.log("historyexistdevicequery");
      try {
        const histroread = await query.limit(filter.limit).offset(filter.offset).getRawMany();
        await histroread.forEach(element => {

          historyread.push({
            startdate: element.devicehistory_readsStartDate,
            enddate: element.devicehistory_readsEndDate,
            value: element.devicehistory_readsvalue
          })

        })
      } catch (error) {
        console.log(error)
        this.logger.error(`Failed to retrieve device`, error.stack);
      }
    }
   // console.log("1513")
    //console.log(deviceOnboarded);
   // console.log(filter.end);
    if (new Date(deviceOnboarded).getTime() < new Date(filter.end).getTime()) {
      console.log("offset::::::::::::" + filter.offset + "\nlimit:::::::::::::" + filter.limit + "\n device onboarded::::::::::" + deviceOnboarded.toString() + "\nend:::::::::" + filter.end.toString())

      let readsFilter: FilterDTO = {

        offset: filter.offset,
        limit: filter.limit,
        start: filter.start.toString(),
        end: filter.end.toString(),
      };
      if (new Date(filter.start).getTime() > new Date(deviceOnboarded).getTime()) {
        readsFilter = {
          offset: filter.offset,
          limit: filter.limit,
          start: filter.start.toString(),
          end: filter.end.toString(),
        };
      }
      else {
        readsFilter = {
          offset: filter.offset,
          limit: filter.limit,
          start: deviceOnboarded,
          end: filter.end.toString(),
        };
      }

    //  console.log("device onboarded:::::::::" + deviceOnboarded + "\nend:::::::::::::::::" + filter.end);

      if (new Date(filter.start).getTime() < new Date(deviceOnboarded).getTime() || new Date(filter.end).getTime() > new Date(deviceOnboarded).getTime()) {
        let finalongoing = await this.getPaginatedData(externalId, readsFilter, pageNumber);
        //console.log("final ongoing:::::::", finalongoing);

        // const nextPage = pageNumber + 1;

        // const nextPageData = await this.getPaginatedData(externalId, readsFilter, nextPage);

        // let nextReadTime;

        // if (nextPageData.length > 0) {
        //   // @ts-ignore
        //   nextReadTime = nextPageData[0].timestamp;
        // } else {
        //   nextReadTime = null;
        // }
        let previousReadTime;
        if (pageNumber > 1) {
          const previousPage = pageNumber - 1;
         const previousPageData = await this.getPaginatedData(externalId, readsFilter, previousPage);
          if (previousPageData.length > 0) {
            // @ts-ignore
            previousReadTime = previousPageData[0].timestamp;
            // @ts-ignore
            console.log("previous page read data[0]::::" + previousPageData[0].timestamp);
          } else {
            previousReadTime = null;
          }
        }
        const transformedFinalOngoing = [];
        for (let i = 0; i < finalongoing.length; i++) {
          const currentRead = finalongoing[i];
          let startdate;
          if (i === 0 && pageNumber == 1) {
            startdate = new Date(Math.max(new Date(deviceOnboarded).getTime(), new Date(filter.start).getTime()));
          } else if (i == 0 && pageNumber != 1) {
            // @ts-ignore
            startdate = previousReadTime;
          }
          else {
            startdate = transformedFinalOngoing[i - 1].enddate;
          }
          // @ts-ignore
          const enddate = finalongoing[i].timestamp;
          if (i > 1) {
            transformedFinalOngoing.push({
              startdate: transformedFinalOngoing[i - 1].enddate,
              enddate: enddate,
              // @ts-ignore
              value: currentRead.value
            });
          }
          else {
            transformedFinalOngoing.push({
              startdate: startdate,
              enddate: enddate,
              //@ts-ignore
              value: currentRead.value
            });
          }
        }
        ongoing = transformedFinalOngoing;
      //  console.log(ongoing);
        console.log("count of ong reads:::::::::::::::::::::::::::::::::::" + await this.getnumberOfOngReads(filter.start, filter.end, externalId, deviceOnboarded))
        if (typeof pageNumber === 'number' && !isNaN(pageNumber)) {

          return { historyread, ongoing, "numberOfReads": numberOfReads, "numberOfPages": numberOfPages, "currentPageNumber": pageNumber };
        }
        else {
          return { historyread, ongoing, "numberOfReads": numberOfReads, "numberOfPages": numberOfPages, "currentPageNumber": 1 };
        }
      }
    }
  }

  async getnumberOfHistReads(deviceId, startDate, endDate) {
    const query = this.historyrepository.createQueryBuilder("devicehistory")
      .where("devicehistory.externalId = :deviceId", { deviceId })
      .andWhere("devicehistory.readsStartDate <= :endDate", { endDate })
      .andWhere("devicehistory.readsEndDate >= :startDate", { startDate });

    const count = await query.getCount();
    return count;
  }


  async getnumberOfOngReads(start: Date, end: Date, externalId, onboarded: Date) {
    console.log(externalId)
    if (new Date(onboarded).getTime() > new Date(end).getTime()) {
      console.log('The given dates are not for on-going reads')
      return 0;
    }
    let fluxquery = ``;
    if (new Date(start).getTime() > new Date(onboarded).getTime()) {
      fluxquery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r._measurement == "read" and r.meter == "${externalId}")
  |> count()`;
    }

    else {
      fluxquery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
  |> range(start: ${onboarded}, stop: ${end})
  |> filter(fn: (r) => r._measurement == "read"and r.meter == "${externalId}")
  |> count()`;
    }
    let noOfReads = await this.ongExecute(fluxquery);

    return noOfReads;
  }


  async ongExecute(query: any) {
    const data: any = await this.dbReader.collectRows(query);
    if (typeof data[0] === 'undefined' || data.length == 0) {
      console.log("type of data is undefined")
      return 0;
    }
    return Number(data[0]._value);
  }


  async latestread(meterId, deviceOnboarded) {
    let query = `
from(bucket: "${process.env.INFLUXDB_BUCKET}")
|> range(start: ${deviceOnboarded}, stop: now())
|> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
|> last()
`;

    return await this.execute(query);
  }
  /* */

  async getAccumulatedReads(meter: string, organizationId, developerExternalId, accumulationType, month: number, year: number) {
    let startDate;
    let numberOfDays;
    let endDate;
    if (month && year) {
      startDate = this.convertToISODate(month, year);
      numberOfDays = this.getNumberOfDaysInMonth(month, year);
      endDate = DateTime.fromISO(startDate).plus({ days: numberOfDays }).minus({ seconds: 1 }).toISODate() + "T00:00:00Z";
    }
    if (year && !month) {
      month = 1;
      startDate = this.convertToISODate(month, year);
      console.log("startDate for year:::::::::::::" + startDate);

      endDate = DateTime.fromISO(startDate)
        .plus({ years: 1 })
        .minus({ seconds: 1 })
        .toISO({ suppressMilliseconds: true, includeOffset: false }) + "Z";

    }
    console.log("startDate::::::::::::" + startDate);
    console.log("End DAte:::::::::::::" + endDate);

    meter = meter;
    let tempResults = [];
    let finalResults: { timestamp?: string, value?: any }[] = [];
    let response;
    let url;
    const offSet = await this.getOffSetForInfluxQuery(developerExternalId, organizationId, startDate);
    console.log("THE OFFSET RETURNED:::" + offSet);

    const formattedOffSet = offSet.formattedOffset;

    const monthlyQuery = `SELECT time, SUM("read") AS total_meter_reads FROM "read" WHERE time >= '${startDate}' AND time < '${endDate}'  AND meter = '${meter}'GROUP BY time(1d,${formattedOffSet})`;
    const yearlyQuery = `SELECT time, SUM("read") AS total_meter_reads FROM "read" WHERE time >= '${startDate}' AND time < '${endDate}'  AND meter = '${meter}'GROUP BY time(30d,${formattedOffSet})`;
    console.log("accumulation type:::::::::::::::::" + accumulationType);
    if (accumulationType === 'Monthly' && month && year) {
      url = `${process.env.INFLUXDB_URL}/query?db=${process.env.INFLUXDB_DB}&q=${monthlyQuery}`;
    }

    else if (accumulationType === 'Yearly' && year) {
      url = `${process.env.INFLUXDB_URL}/query?db=${process.env.INFLUXDB_DB}&q=${yearlyQuery}`;
    }

    else {
      throw new HttpException('Invalid accumulationType', HttpStatus.BAD_REQUEST);
    }

    const config = {
      auth: {
        username: `${process.env.INFLUXDB_ADMIN_USER}`,
        password: `${process.env.INFLUXDB_ADMIN_PASSWORD}`,
      },
    };

    try {
      response = await axios.get(url, config);

      if (!response) {
        throw new HttpException('Some Error occured', HttpStatus.AMBIGUOUS);
      }


      if (!response.data.results[0].series) {
        throw new HttpException('No reads found', HttpStatus.CONFLICT);
      }
      tempResults = this.readFilterNullUndefined(response.data.results[0].series[0].values)
    } catch (error) {
      console.error(error);
      throw error;
    }



    for (let i = 0; i < tempResults.length; i++) {
      let resultObj: { startTime?: string, endTime?: string, value?: any } = {};
      for (let j = 0; j < 2; j++) {
        if (j % 2 === 0) {
          const startDateStr = new Date(tempResults[i][j]).getTime();
          const startDate = new Date(startDateStr);
          const isoStartDateStr = startDate.toISOString();
          resultObj.startTime = isoStartDateStr;
        } else {
          resultObj.value = tempResults[i][j];
          if (i < tempResults.length - 1) {
            const endDateStr = new Date(tempResults[i + 1][j - 1]).getTime();
            const endDate = new Date(endDateStr);
            const isoEndDateStr = endDate.toISOString();
            resultObj.endTime = isoEndDateStr;
          } else {
            resultObj.endTime = endDate;
          }
        }
      }

      finalResults.push(resultObj);
    }
    console.log(finalResults);
    return { 'aggregateType': accumulationType, 'accumulatedReads': finalResults, 'timezone': offSet.localTimeZone };
  }

  readFilterNullUndefined(arr) {
    for (let i = 0; i < arr.length; i++) {

      for (let j = 0; j < 2; j++) {
        if (j % 2 != 0) {
          if ((arr[i])[j] == null || (arr[i])[j] == undefined) {
            (arr[i])[j] = 0;
          }
        }
      }

    }
    return arr;
  }


  convertToISODate(month, year) {
    const isoDate = DateTime.fromObject({
      year: year,
      month: month,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      zone: 'utc'
    }).toISO({ suppressMilliseconds: true });

    return isoDate;
  }

  getNumberOfDaysInMonth(month, year) {
    return DateTime.fromObject({
      year: year,
      month: month,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0
    }).daysInMonth;
  }

  //  @Cron(CronExpression.EVERY_10_SECONDS)
  //  async  addOffSetToStartAndEndDates(externalId,organizationId,startDate,endDate)
  //   {     

  //     let device = await this.deviceService.findDeviceByDeveloperExternalId(externalId, organizationId);
  //     console.log("DEVICE:::::::::::"+device)


  //       console.log("THIS IS THE LAT "+device.latitude+"AND LONG"+device.longitude);
  //       const localTime=getLocalTime(startDate,device);//timezone of the device.
  //       console.log("calling the localtimezone function")
  //       const localTimeZone=getLocalTimeZoneFromDevice(localTime,device);
  //       console.log("calling the offset function");
  //       const nonFormattedOffSet=getOffsetFromTimeZoneName(localTimeZone);
  //       const offset=getFormattedOffSetFromOffsetAsJson(nonFormattedOffSet);
  //       console.log("FINAL OFFSET HOURS::::::"+offset.hours);
  //       console.log("FINAL OFFSET MINUTES::::::"+offset.minutes);


  //   const parsedStartDate = new Date(startDate);
  //   const parsedEndDate = new Date(endDate);

  //   parsedStartDate.setUTCHours(parsedStartDate.getUTCHours() + offset.hours);
  //   parsedStartDate.setUTCMinutes(parsedStartDate.getUTCMinutes() + offset.minutes);
  //   parsedEndDate.setUTCHours(parsedEndDate.getUTCHours() + offset.hours);
  //   parsedEndDate.setUTCMinutes(parsedEndDate.getUTCMinutes() + offset.minutes);

  //   const updatedStartDate = parsedStartDate.toISOString();
  //   const updatedEndDate = parsedEndDate.toISOString();

  //     console.log("UPDATED START DATE::::"+updatedStartDate);
  //     console.log("UPDATED END DATE::::::::::"+updatedEndDate);

  //   return {
  //     "startDate":updatedStartDate,
  //     "endDate":updatedEndDate
  //   }

  //   }


  async getPaginatedData(meter: string, filter: any, page: number): Promise<unknown[]> {
    console.log("page: " + page);
    const pageSize = filter.limit;
    const skipCount = (page - 1) * pageSize;
    const data = await this.retrieveDataWithLastValue(meter, filter, skipCount, pageSize);
    console.log("data:", data);
    return data;
  }

  async retrieveDataWithLastValue(meter: string, filter: any, skipCount: number, pageSize: number): Promise<unknown[]> {
    let currentQuery: string;

    if (filter.lastValue) {
      let newDateTime = new Date(new Date(filter.lastValue).getTime() + 1000).toISOString();
      currentQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${newDateTime}, stop: ${filter.end})
    |> filter(fn: (r) => r.meter == "${meter}" and r._field == "read")
    |> drop(columns: ["_start", "_stop"])
    |> limit(n: ${pageSize}, offset: ${skipCount})`;
    } else {
      currentQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${filter.start}, stop: ${filter.end})
    |> filter(fn: (r) => r.meter == "${meter}" and r._field == "read")
    |> drop(columns: ["_start", "_stop"])
    |> limit(n: ${pageSize}, offset: ${skipCount})`;
    }

    const org = process.env.INFLUXDB_ORG;
    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;

    const influxDB = new InfluxDB({ url, token });
    const queryApi = influxDB.getQueryApi(org);
    const result = await influxDB.getQueryApi(org).collectRows(currentQuery);

    return result.map((record: any) => ({
      timestamp: new Date(record._time),
      value: Number(record._value),
    }));
  }


  //
  async getOffSetForInfluxQuery(developerExternalId, organizationId, startDate) {

    let localTime = null;
    let formattedOffset = null;
    let device = await this.deviceService.findDeviceByDeveloperExternalId(developerExternalId, organizationId);
   // console.log("DEVICE:::::::::::" + device);
    if (device.latitude && device.longitude) {
     // console.log("THIS IS THE LAT " + device.latitude + "AND LONG" + device.longitude);
     // console.log("calling the localtimezone function");
      localTime = getLocalTime(startDate, device);
    }

    const localTimeZone = getLocalTimeZoneFromDevice(localTime, device);
   // console.log("localTimeZone:::::" + localTimeZone);
   // console.log("calling the offset function");
    const localTimeZoneName = localTimeZone;
   // console.log("TIME ZONE BEING SENT::::" + localTimeZoneName);
    const nonFormattedOffSet = getOffsetFromTimeZoneName(localTimeZoneName);
    const offset = getFormattedOffSetFromOffsetAsJson(nonFormattedOffSet);
   // console.log("FINAL OFFSET HOURS::::::" + typeof (offset.hours));
   // console.log("FINAL OFFSET MINUTES::::::" + typeof (offset.minutes));

    const offSetHoursString = (offset.hours).toString();
    const offSetMinutesString = (offset.minutes).toString();

    formattedOffset = offSetHoursString + 'h' + offSetMinutesString + 'm';

    console.log("FORMATTED OFFSET BEING RETURNED:::" + formattedOffset);

    return { 'formattedOffset': formattedOffset, 'offSetHours': offset.hours, 'offSetMinutes': offset.minutes, 'localTimeZone': localTimeZoneName };

  }


  async getOngoingReads(meter, filter): Promise<any> {

    console.log("IN THE FUNCTION TO GET ONGOING READS");

    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;
    const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    console.log('filter.start:::::::' + filter);
    // console.log('filter.end:::::::::' + filter.end);
    // console.log('filter.limit:::::::' + filter.limit);
    // console.log('filter.offset:::::' + filter.offset);
    // console.log('meter:::::::::::::' + meter);

    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}") |> range(start:${filter.start} , stop:${filter.end} ) |> filter(fn: (r) => r.meter == "${meter}" and r._field == "read") |> limit(n:${filter.limit} , offset:${filter.offset})`;

    // const result = await queryApi.queryRaw(fluxQuery);
    const result = await queryApi.collectRows(fluxQuery);
    console.log(result);
    console.log('\ncollect-rows query SUCCESS');
    return result
  }

}