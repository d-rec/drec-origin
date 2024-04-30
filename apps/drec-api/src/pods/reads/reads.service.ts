import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  FindOneOptions,
  Repository,
  Brackets,
  SelectQueryBuilder,
  In,
  FindOptionsWhere,
  Any,
} from 'typeorm';

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
import {
  NewIntmediateMeterReadDTO,
  IntmediateMeterReadDTO,
} from './dto/intermediate_meter_read.dto';
import {
  Iintermediate,
  NewReadDTO,
  IAggregateintermediate,
} from '../../models';
import { InjectRepository } from '@nestjs/typeorm';
import { GetMarketplaceOrganizationHandler } from '@energyweb/origin-backend/dist/js/src/pods/organization/handlers/get-marketplace-organization.handler';
import { ReadStatus } from '../../utils/enums';
import { DeltaFirstRead } from './delta_firstread.entity';
import { HistoryNextInssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { ReadFilterDTO } from './dto/filter.dto';
import * as mapBoxTimeSpace from '@mapbox/timespace';
import * as momentTimeZone from 'moment-timezone';
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client';

import { Cron, CronExpression } from '@nestjs/schedule';
import { response } from 'express';
import { EndReservationdateDTO } from '../device-group/dto';
import { timestamp } from 'rxjs/operators';
import {
  getFormattedOffSetFromOffsetAsJson,
  getLocalTime,
  getLocalTimeZoneFromDevice,
  getOffsetFromTimeZoneName,
} from '../../utils/localTimeDetailsForDevice';
import { log } from 'console';

export type TUserBaseEntity = ExtendedBaseEntity & IAggregateintermediate;

@Injectable()
export class ReadsService {
  private readonly logger = new Logger(ReadsService.name);
  private readonly influxDB: InfluxDB;
  private readonly queryApi: QueryApi;
  constructor(
    @InjectRepository(AggregateMeterRead)
    private readonly repository: Repository<AggregateMeterRead>,
    @InjectRepository(HistoryIntermediate_MeterRead)
    private readonly historyrepository: Repository<HistoryIntermediate_MeterRead>,
    @InjectRepository(DeltaFirstRead)
    private readonly deltarepository: Repository<DeltaFirstRead>,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadService,
    private readonly deviceService: DeviceService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly organizationService: OrganizationService,
    private readonly eventBus: EventBus,
  ) {
    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
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
    const device = await this.deviceService.findReads(id);

    if (!device) {
      throw new NotFoundException(`No device found with external id ${id}`);
    }
    const roundedMeasurements = this.roundMeasurementsToUnit(measurements);
    const filteredMeasurements = await this.filterMeasurements(
      id,
      roundedMeasurements,
      device,
    );
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
    this.logger.debug(
      `${read.value + margin * read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
    );
    return Math.round(read.value + margin * read.value) < maxEnergy;
  }

  public findlastRead(deviceId: string): Promise<AggregateMeterRead[]> {
    return this.repository.find({
      where: { externalId: deviceId },
      order: {
        id: 'DESC',
      },
      take: 1,
    });
  }

  public async newstoreRead(
    id: string,
    measurements: NewIntmediateMeterReadDTO,
  ): Promise<void> {
    this.logger.debug('DREC is storing smart meter reads:');
    this.logger.debug(JSON.stringify(measurements));
    const device = await this.deviceService.findReads(id);
    if (!device) {
      throw new NotFoundException(`No device found with external id ${id}`);
    }

    if (
      device.timezone === null &&
      measurements.timezone !== null &&
      measurements.timezone !== undefined &&
      measurements.timezone.toString().trim() !== ''
    ) {
      await this.deviceService.updatetimezone(
        device.externalId,
        measurements.timezone,
      );
    }

    const roundedMeasurements = this.NewroundMeasurementsToUnit(measurements);

    const filteredMeasurements = await this.NewfilterMeasurements(
      id,
      roundedMeasurements,
      device,
    );
    this.logger.verbose(filteredMeasurements);
    await this.newstoreGenerationReading(id, filteredMeasurements, device);
  }

  private NewroundMeasurementsToUnit(
    measurement: NewIntmediateMeterReadDTO,
  ): NewIntmediateMeterReadDTO {
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
    const final = await this.NewfindLatestRead(deviceId, device.createdAt);
    this.logger.verbose(`final: ${final}`);
    const reads: any = [];

    if (measurement.type === 'History') {
      await new Promise((resolve, reject) => {
        measurement.reads.forEach(async (element, measurmentreadindex) => {
          const requeststartdate = DateTime.fromISO(
            new Date(element.starttimestamp).toISOString(),
          );
          const requestcurrentend = DateTime.fromISO(
            new Date(element.endtimestamp).toISOString(),
          );
          const meteredTimePeriod = Math.abs(
            requeststartdate.diff(requestcurrentend, ['hours']).toObject()
              ?.hours || 0,
          );

          const checkhistroyreading = await this.checkhistoryreadexist(
            device.externalId,
            element.starttimestamp,
            element.endtimestamp,
          );
          const historyAge = new Date(device.createdAt);
          historyAge.setFullYear(historyAge.getFullYear() - 3);
          this.logger.verbose('historyAge');

          if (checkhistroyreading) {
            return reject(
              new ConflictException({
                success: false,
                message: `There are already one or more historical entries for this device which are conflicting current reading start date and/or end date `,
              }),
            );
          }

          if (
            requeststartdate <=
              DateTime.fromISO(new Date(historyAge).toISOString()) ||
            requeststartdate >=
              DateTime.fromISO(new Date(device?.createdAt).toISOString()) ||
            requestcurrentend <=
              DateTime.fromISO(new Date(historyAge).toISOString()) ||
            requestcurrentend >=
              DateTime.fromISO(new Date(device?.createdAt).toISOString())
          ) {
            return reject(
              new ConflictException({
                success: false,
                message: `For History Type Reads of devices start time and/or end time should be within 3 year of device onboarding, ex: device onboarded date: ${device?.createdAt}maximum date allowed for start and end date should be within 3 year in past from onboarded date, ${device?.createdAt}`,
              }),
            );
          }
          const read: ReadDTO = {
            timestamp: new Date(element.endtimestamp),
            value: element.value,
          };
          const historyvalidation = await this.NewhistoryvalidateEnergy(
            read,
            device,
            meteredTimePeriod,
            measurement,
            requeststartdate.toJSDate(),
            requestcurrentend.toJSDate(),
          );
          this.logger.verbose(historyvalidation);
          if (historyvalidation) {
            reads.push({
              timestamp: new Date(element.endtimestamp),
              value: element.value,
            });
          } else {
            this.logger.verbose('436');
            return reject(
              new ConflictException({
                success: false,
                message: 'Failed,read value is greater than from MaxEnergy',
              }),
            );
          }
          if (measurmentreadindex == measurement.reads.length - 1) {
            resolve(true);
          }
        });
      });
      return {
        reads: reads,
        unit: measurement.unit,
      };
    } else if (measurement.type === 'Delta') {
      if (!final) {
        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {
            if (final && final['timestamp']) {
              if (
                new Date(element.endtimestamp).getTime() <
                new Date(final.timestamp).getTime()
              ) {
                return reject(
                  new ConflictException({
                    success: false,
                    message:
                      `The sent date for reading ${element.endtimestamp} is less than last sent meter read date ${final.timestamp}`,
                  }),
                );
              }
            }
            const read: ReadDTO = {
              timestamp: new Date(element.endtimestamp),
              value: element.value,
            };
            reads.push({
              timestamp: new Date(element.endtimestamp),
              value: element.value,
            });
            await this.deltarepository.save({
              readsvalue: element.value,
              externalId: deviceId,
              unit: measurement.unit,
              readsEndDate: element.endtimestamp.toString(),
            });
            if (measurmentreadindex == measurement.reads.length - 1) {
              resolve(true);
            }
          });
        });
        await this.deviceService.updatereadtype(deviceId, measurement.type);
        return {
          reads: reads,
          unit: measurement.unit,
        };
      } else {
        if (
          device?.meterReadtype != measurement.type &&
          device?.meterReadtype != null
        ) {
          throw new NotFoundException(
            `In this device you can add read for ${device?.meterReadtype} type but you are sending  ${measurement.type}`,
          );
        } else {
          await new Promise((resolve, reject) => {
            measurement.reads.forEach((element, measurmentreadindex) => {
              this.logger.verbose(`endtimestamp: ${element.endtimestamp}
              ${typeof element.endtimestamp}
              timestamp: ${final.timestamp}
              ${typeof final.timestamp}
              timestamp: ${final.timestamp.toISOString()}
              ${typeof final.timestamp.toISOString()}`);
              if (final && final['timestamp']) {
                if (
                  new Date(element.endtimestamp).getTime() <
                  new Date(final.timestamp).getTime()
                ) {
                  return reject(
                    new ConflictException({
                      success: false,
                      message:
                        `The sent date for reading ${element.endtimestamp} is less than last sent meter read date ${final.timestamp.toISOString()}`,
                    }),
                  );
                }
              }

              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: element.value,
              };
              const newdeltavalidation = this.NewvalidateEnergy(
                read,
                final,
                device,
              );
              if (newdeltavalidation.success) {
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: element.value,
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: newdeltavalidation.message,
                  }),
                );
              }
              if (measurmentreadindex == measurement.reads.length - 1) {
                resolve(true);
              }
            });
          });
          return {
            reads: reads,
            unit: measurement.unit,
          };
        }
      }
    } else if (measurement.type === 'Aggregate') {
      if (!final) {
        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {
            const lastvalue = await this.findlastRead(deviceId);
            let Delta = 0;
            if (lastvalue.length > 0) {
              Delta = Math.abs(element.value - lastvalue[0].value);

              if (
                new Date(element.endtimestamp).getTime() <
                  new Date(lastvalue[0].datetime).getTime() ||
                element.value <= lastvalue[0].value
              ) {
                return reject(
                  new ConflictException({
                    success: false,
                    message: `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent mter read date/value ${lastvalue[0].datetime}/${lastvalue[0].value} `,
                  }),
                );
              }

              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: Delta,
              };
              const firstvalidation = this.firstvalidateEnergy(read, device);
              if (firstvalidation.success) {
                await this.repository.save({
                  value: element.value,
                  deltaValue: Delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString(),
                });
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: Delta,
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: firstvalidation.message,
                  }),
                );
              }
            } else {
              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: element.value,
              };
              const firstvalidation = this.firstvalidateEnergy(read, device);
              if (firstvalidation.success) {
                await this.repository.save({
                  value: element.value,
                  deltaValue: Delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString(),
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: firstvalidation.message,
                  }),
                );
              }
            }
            if (measurmentreadindex == measurement.reads.length - 1) {
              resolve(true);
            }
          });
        });
        await this.deviceService.updatereadtype(deviceId, measurement.type);
        return {
          reads: reads,
          unit: measurement.unit,
        };
      } else {
        if (
          device?.meterReadtype != measurement.type &&
          device?.meterReadtype != null
        ) {
          throw new NotFoundException(
            `In this device you can add read for ${device?.meterReadtype} type but you are sending  ${measurement.type}`,
          );
        }
        await new Promise((resolve, reject) => {
          measurement.reads.forEach(async (element, measurmentreadindex) => {
            const lastvalue = await this.findlastRead(deviceId);
            let Delta;
            if (lastvalue.length > 0) {
              Delta = Math.abs(element.value - lastvalue[0].value);
              if (
                new Date(element.endtimestamp).getTime() <
                  new Date(lastvalue[0].datetime).getTime() ||
                element.value <= lastvalue[0].value
              ) {
                return reject(
                  new ConflictException({
                    success: false,
                    message: `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent mter read date/value ${lastvalue[0].datetime}/${lastvalue[0].value} `,
                  }),
                );
              }

              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: Delta,
              };
              const newvalidation = this.NewvalidateEnergy(read, final, device);
              if (newvalidation.success) {
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: Delta,
                });
                await this.repository.save({
                  value: element.value,
                  deltaValue: Delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString(),
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: newvalidation.message,
                  }),
                );
              }
            }
            if (measurmentreadindex == measurement.reads.length - 1) {
              resolve(true);
            }
          });
        });

        return {
          reads: reads,
          unit: measurement.unit,
        };
      }
    }
  }

  async NewfindLatestRead(
    meterId: string,
    deviceregisterdate: Date,
  ): Promise<ReadDTO | void> {
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${deviceregisterdate}, stop: now())
    |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
    |> last()`;
    const reads = await this.execute(fluxQuery);
    return reads[0];
  }

  async findLastReadForMeterWithinRange(
    meterId: string,
    startdate: Date,
    enddate: Date,
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: ${startdate.getTime()}, stop: ${enddate.getTime()})
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
    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;

    return new InfluxDB({ url, token }).getQueryApi(org);
  }

  private async checkhistoryreadexist(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const query = this.getexisthistorydevcielogFilteredQuery(
      deviceid,
      startDate,
      endDate,
    );
    try {
      const device = await query.getRawMany();

      return device.length > 0;
    } catch (error) {
      this.logger.error(`Failed to retrieve device`, error.stack);
    }
  }
  private getexisthistorydevcielogFilteredQuery(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<HistoryIntermediate_MeterRead> {
    this.logger.verbose(startDate);
    this.logger.verbose(endDate);

    const query = this.historyrepository
      .createQueryBuilder('devicehistory')
      .where('devicehistory.externalId = :deviceid', { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where(
            'devicehistory.readsStartDate BETWEEN :startDateFirstWhere AND :endDateFirstWhere ',
            { startDateFirstWhere: startDate, endDateFirstWhere: endDate },
          )
            .orWhere(
              'devicehistory.readsEndDate BETWEEN :startDateSecondtWhere AND :endDateSecondWhere',
              { startDateSecondtWhere: startDate, endDateSecondWhere: endDate },
            )
            .orWhere(
              ':startdateThirdWhere BETWEEN devicehistory.readsStartDate AND devicehistory.readsEndDate',
              { startdateThirdWhere: startDate },
            )
            .orWhere(
              ':enddateforthdWhere BETWEEN devicehistory.readsStartDate AND devicehistory.readsEndDate',
              { enddateforthdWhere: endDate },
            );
        }),
      );
    return query;
  }
  private firstvalidateEnergy(
    read: ReadDTO,
    device: DeviceDTO,
  ): { success: boolean; message: string } {
    const computeMaxEnergy = (
      capacity: number,
      meteredTimePeriod: number,
      deviceAge: number,
      degradationPercentage: number,
      yieldValue: number,
    ) => {
      // Max calculated energy formula
      // Old formula: Device capacity [kW] * metered time period [h] * device age [years] * degradation [%/year] * yield [kWh/kW]
      //New formula: Device capacity [kW]  * metered time period [h] * (Yield [kWh/kW] / 8760)* (1-degradation [%/year])^(device age [years] - 1)
      this.logger.debug(
        'New formula: Device capacity [kW]  * metered time period [h] * (Yield [kWh/kW] / 8760)* (1-degradation [%/year])^(device age [years] - 1)',
      );
      return (
        capacity *
        meteredTimePeriod *
        (yieldValue / 8760) *
        Math.pow(1 - degradationPercentage, deviceAge - 1)
      );
    };
    this.logger.debug(JSON.stringify(read));
    const degradation = 0.5; // [%/year]
    const degradationPercentage = degradation / 100;
    const yieldValue = device.yieldValue || 2000; // [kWh/kW]
    const capacity = device.capacity * 1000; // capacity in KilloWatt and read in Wh so coverting in Watt
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    if (deviceAge <= 0) {
      deviceAge = 1;
    }
    const currentRead = DateTime.fromISO(read.timestamp.toISOString());
    const lastRead = DateTime.fromISO(new Date(device.createdAt).toISOString());

    const meteredTimePeriod = Math.abs(
      currentRead.diff(lastRead, ['hours']).toObject()?.hours || 0,
    ); // hours

    const maxEnergy = computeMaxEnergy(
      capacity,
      meteredTimePeriod,
      deviceAge,
      degradationPercentage,
      yieldValue,
    );
    const finalmax = maxEnergy * (120 / 100);
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${degradation}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < finalmax ? 'Passed' : 'Failed'}, MaxEnergy: ${finalmax}`,
    );
    this.logger.verbose(`hgfgfdt871, ${Math.round(read.value)}`);
    if (read.value < finalmax) {
      return {
        success: true,
        message: 'Validation successful',
      };
    } else {
      return {
        success: false,
        message: `Failed, MaxEnergy: ${finalmax}`,
      };
    }
  }
  private NewvalidateEnergy(
    read: ReadDTO,
    final: ReadDTO,
    device: DeviceDTO,
  ): { success: boolean; message: string } {
    const computeMaxEnergy = (
      capacity: number,
      meteredTimePeriod: number,
      deviceAge: number,
      degradationPercentage: number,
      yieldValue: number,
    ) => {
      // Max calculated energy formula
      // Old formula: Device capacity [kW] * metered time period [h] * device age [years] * degradation [%/year] * yield [kWh/kW]
      //New formula: Device capacity [kW]  * metered time period [h] * (Yield [kWh/kW] / 8760)* (1-degradation [%/year])^(device age [years] - 1)
      this.logger.debug(
        'New formula: Device capacity [kW]  * metered time period [h] * (Yield [kWh/kW] / 8760)* (1-degradation [%/year])^(device age [years] - 1)',
      );
      return (
        capacity *
        meteredTimePeriod *
        (yieldValue / 8760) *
        Math.pow(1 - degradationPercentage, deviceAge - 1)
      );
    };
    const degradation = 0.5; // [%/year]
    const degradationPercentage = degradation / 100;
    const yieldValue = device.yieldValue || 2000; // [kWh/kW]
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
    const maxEnergy = computeMaxEnergy(
      capacity,
      meteredTimePeriod,
      deviceAge,
      degradationPercentage,
      yieldValue,
    );
    const finalmax = maxEnergy * (120 / 100);
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${degradation}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < finalmax ? 'Passed' : 'Failed'}, MaxEnergy: ${finalmax}`,
    );
    if (read.value < finalmax) {
      return {
        success: true,
        message: 'Validation successful',
      };
    } else {
      return {
        success: false,
        message: `Failed, MaxEnergy: ${finalmax}`,
      };
    }
  }

  async NewhistoryvalidateEnergy(
    read: ReadDTO,
    device: DeviceDTO,
    requestmeteredTimePeriod: number,
    measurement: NewIntmediateMeterReadDTO,
    startdate: Date,
    enddate: Date,
  ): Promise<boolean> {
    const computeMaxEnergy = (
      capacity: number,
      meteredTimePeriod: number,
      deviceAge: number,
      degradationPercentage: number,
      yieldValue: number,
    ) => {
      // Max calculated energy formula
      // Old formula: Device capacity [kW] * metered time period [h] * device age [years] * degradation [%/year] * yield [kWh/kW]
      //New formula: Device capacity [kW]  * metered time period [h] * (Yield [kWh/kW] / 8760)* (1-degradation [%/year])^(device age [years] - 1)
      this.logger.debug(
        'New formula: Device capacity [kW]  * metered time period [h] * (Yield [kWh/kW] / 8760)* (1-degradation [%/year])^(device age [years] - 1)',
      );
      return (
        capacity *
        meteredTimePeriod *
        (yieldValue / 8760) *
        Math.pow(1 - degradationPercentage, deviceAge - 1)
      );
    };

    this.logger.debug(JSON.stringify(read));
    const degradation = 0.5; // [%/year]
    const degradationPercentage = degradation / 100;
    const yieldValue = device.yieldValue || 2000; // [kWh/kW]
    const capacity = device.capacity * 1000; // capacity in KilloWatt and read in Wh so coverting in Watt
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    if (deviceAge <= 0) {
      deviceAge = 1;
    }
    const meteredTimePeriod = requestmeteredTimePeriod;
    const maxEnergy = computeMaxEnergy(
      capacity,
      meteredTimePeriod,
      deviceAge,
      degradationPercentage,
      yieldValue,
    );
    const finalmax = maxEnergy * (120 / 100);
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${degradation}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < finalmax ? 'Passed' : 'Failed'}, MaxEnergy: ${finalmax}`,
    );

    if (read.value < finalmax) {
      this.historyrepository.save({
        type: measurement.type,
        externalId: device.externalId,
        unit: measurement.unit,
        readsvalue: read.value,
        readsStartDate: startdate,
        readsEndDate: enddate,
      });
      this.logger.verbose('1267');
      if (device.groupId != null) {
        const historynextissue =
          await this.deviceGroupService.getNextHistoryissuanceDevicelogafterreservation(
            device.externalId,
            device.groupId,
          );
        this.logger.verbose('historynextissue');
        if (historynextissue != undefined) {
          const stdate = new Date(startdate).getTime();
          const eddate = new Date(enddate).getTime();
          const reservSdate = new Date(
            historynextissue.reservationStartDate,
          ).getTime();
          this.logger.verbose(reservSdate);
          const reservEdate = new Date(
            historynextissue.reservationEndDate,
          ).getTime();
          this.logger.verbose(reservEdate);
          this.logger.verbose(stdate >= reservSdate && stdate < reservEdate);
          this.logger.verbose(eddate <= reservEdate && eddate > reservSdate);
          if (
            stdate >= reservSdate &&
            stdate < reservEdate &&
            eddate <= reservEdate &&
            eddate > reservSdate
          ) {
            this.deviceGroupService.HistoryUpdatecertificateissuedate(
              historynextissue.id,
              HistoryNextInssuanceStatus.Pending,
            );
          }
        }
      }
      return read.value < finalmax;
    } else {
      return false;
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
  public async getCheckHistoryCertificateIssueDateLogForDevice(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HistoryIntermediate_MeterRead[]> {
    const query = this.gethistorydevcielogFilteredQuery(
      deviceid,
      startDate,
      endDate,
    );

    try {
      const device = await query.getRawMany();
      const devices = device.map((s: any) => {
        const item: any = {
          id: s.devicehistory_id,
          readsStartDate: s.devicehistory_readsStartDate,
          readsEndDate: s.devicehistory_readsEndDate,
          readsvalue: s.devicehistory_readsvalue,
          externalId: s.devicehistory_externalId,
        };
        return item;
      });

      return devices;
    } catch (error) {
      this.logger.error(`Failed to retrieve device`, error.stack);
    }
  }

  private gethistorydevcielogFilteredQuery(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<HistoryIntermediate_MeterRead> {
    const query = this.historyrepository
      .createQueryBuilder('devicehistory')
      .where('devicehistory.externalId = :deviceid', { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where(
            new Brackets((db1) => {
              db1
                .where(
                  'devicehistory.readsStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1',
                  {
                    reservationStartDate1: startDate,
                    reservationEndDate1: endDate,
                  },
                )
                .orWhere(
                  'devicehistory.readsStartDate = :reservationStartDate',
                  { reservationStartDate: startDate },
                );
            }),
          ).andWhere(
            new Brackets((db2) => {
              db2
                .where(
                  'devicehistory.readsEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2',
                  {
                    reservationStartDate2: startDate,
                    reservationEndDate2: endDate,
                  },
                )
                .orWhere('devicehistory.readsEndDate = :reservationEndDate ', {
                  reservationEndDate: endDate,
                });
            }),
          );
        }),
      )
      .andWhere('devicehistory.certificate_issued != true');
    return query;
  }

  async getDeviceHistoryCertificateIssueDate(
    conditions: FindOptionsWhere<HistoryIntermediate_MeterRead>,
  ): Promise<HistoryIntermediate_MeterRead | null> {
    return (
      (await this.historyrepository.findOne({
        where: conditions as FindOptionsWhere<HistoryIntermediate_MeterRead>,
      })) ?? null
    );
  }
  async updatehistorycertificateissuedate(
    id: number,
    startdate: Date,
    enddate: Date,
  ): Promise<HistoryIntermediate_MeterRead> {
    const historydevice = await this.getDeviceHistoryCertificateIssueDate({
      id: id,
    });
    let updatedhistoryissue = new HistoryIntermediate_MeterRead();
    if (historydevice) {
      historydevice.certificate_issuance_startdate = startdate;
      historydevice.certificate_issuance_enddate = enddate;
      historydevice.certificate_issued = true;
      updatedhistoryissue = await this.historyrepository.save(historydevice);
    }
    return updatedhistoryissue;
  }
  async getAggregateMeterReadsFirstEntryOfDevice(
    meterId: string,
  ): Promise<AggregateMeterRead[]> {
    return this.repository.find({
      where: {
        externalId: meterId,
      },
      take: 1,
    });
  }
  // add new function for Delta firstread filter
  async getDeltaMeterReadsFirstEntryOfDevice(
    meterId: string,
  ): Promise<DeltaFirstRead[]> {
    return this.deltarepository.find({
      where: {
        externalId: meterId,
      },
    });
  }

  /* */

  timeOffset: any;
  async getAllRead(
    externalId,
    filter,
    deviceOnboarded,
    pageNumber: number,
  ): Promise<any> {
    if (new Date(filter.start).getTime() == new Date(filter.end).getTime()) {
      throw new HttpException(
        'The given start and end timestamps are the same',
        400,
      );
    }
    const historyread = [];
    let ongoing = [];
    const finalongoing = [];
    this.logger.verbose(
      'page number:::::::::::::::::::::::::::::::::::::::::::' + pageNumber,
    );

    const sizeOfPage = 5;
    let numberOfPages = 0;
    const numberOfHistReads = await this.getnumberOfHistReads(
      externalId,
      filter.start,
      filter.end,
    );
    let numberOfOngReads = 0;
    let numberOfReads = numberOfHistReads + numberOfOngReads;
    if (numberOfHistReads > 0) {
      numberOfPages = Math.ceil(numberOfHistReads / sizeOfPage);
    }

    if (typeof pageNumber === 'number' && !isNaN(pageNumber)) {
      filter.offset = sizeOfPage * (pageNumber - 1);
      filter.limit = sizeOfPage;
    }
    numberOfOngReads = await this.getnumberOfOngReads(
      filter.start,
      filter.end,
      externalId,
      deviceOnboarded,
    );
    this.logger.verbose(numberOfOngReads);
    if (numberOfOngReads > numberOfHistReads) {
      numberOfPages = Math.ceil(numberOfOngReads / sizeOfPage);
    }
    numberOfReads = numberOfHistReads + numberOfOngReads;
    if (numberOfHistReads == 0 && numberOfOngReads == 0) {
      return {
        historyread,
        ongoing,
        numberOfReads: numberOfReads,
        numberOfPages: 0,
        currentPageNumber: 0,
      };
    }
    if (
      typeof pageNumber === 'number' &&
      !isNaN(pageNumber) &&
      pageNumber > numberOfPages
    ) {
      return {
        historyread,
        ongoing,
        numberOfReads: numberOfReads,
        numberOfPages: numberOfPages,
        currentPageNumber: 1,
      };
    }

    if (
      new Date(filter.start).getTime() <= new Date(deviceOnboarded).getTime()
    ) {
      const query = await this.getexisthistorydevcielogFilteredQuery(
        externalId,
        filter.start,
        filter.end,
      );

      this.logger.verbose(
        'history query executed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
      );
      this.logger.verbose('historyexistdevicequery');
      try {
        const histroread = await query
          .limit(filter.limit)
          .offset(filter.offset)
          .getRawMany();

        await histroread.forEach((element) => {
          historyread.push({
            startdate: element.devicehistory_readsStartDate,
            enddate: element.devicehistory_readsEndDate,
            value: element.devicehistory_readsvalue,
          });
        });
      } catch (error) {
        this.logger.error(`Failed to retrieve device`, error.stack);
      }
    }

    if (new Date(deviceOnboarded).getTime() < new Date(filter.end).getTime()) {
      this.logger.verbose(
        'offset::::::::::::' +
          filter.offset +
          '\nlimit:::::::::::::' +
          filter.limit +
          '\n device onboarded::::::::::' +
          deviceOnboarded.toString() +
          '\nend:::::::::' +
          filter.end.toString(),
      );

      let readsFilter: FilterDTO = {
        offset: filter.offset,
        limit: filter.limit,
        start: filter.start.toString(),
        end: filter.end.toString(),
      };
      if (
        new Date(filter.start).getTime() > new Date(deviceOnboarded).getTime()
      ) {
        readsFilter = {
          offset: filter.offset,
          limit: filter.limit,
          start: filter.start.toString(),
          end: filter.end.toString(),
        };
      } else {
        readsFilter = {
          offset: filter.offset,
          limit: filter.limit,
          start: deviceOnboarded,
          end: filter.end.toString(),
        };
      }
      if (
        new Date(filter.start).getTime() <
          new Date(deviceOnboarded).getTime() ||
        new Date(filter.end).getTime() > new Date(deviceOnboarded).getTime()
      ) {
        const finalongoing = await this.getPaginatedData(
          externalId,
          readsFilter,
          pageNumber,
        );

        let previousReadTime;
        if (pageNumber > 1) {
          const previousPage = pageNumber - 1;
          const previousPageData = await this.getPaginatedData(
            externalId,
            readsFilter,
            previousPage,
          );
          if (previousPageData.length > 0) {
            previousReadTime = (previousPageData[0] as any).timestamp;
            this.logger.verbose(
              'previous page read data[0]::::' + (previousPageData[0] as any).timestamp,
            );
          } else {
            previousReadTime = null;
          }
        }
        const transformedFinalOngoing = [];
        for (let i = 0; i < finalongoing.length; i++) {
          const currentRead = finalongoing[i];
          let startdate;
          if (i === 0 && pageNumber == 1) {
            startdate = new Date(
              Math.max(
                new Date(deviceOnboarded).getTime(),
                new Date(filter.start).getTime(),
              ),
            );
          } else if (i == 0 && pageNumber != 1) {
            startdate = previousReadTime;
          } else {
            startdate = transformedFinalOngoing[i - 1].enddate;
          }
          const enddate = (finalongoing[i] as any).timestamp;
          if (i > 1) {
            transformedFinalOngoing.push({
              startdate: transformedFinalOngoing[i - 1].enddate,
              enddate: enddate,
              value: (currentRead as any).value,
            });
          } else {
            transformedFinalOngoing.push({
              startdate: startdate,
              enddate: enddate,
              value: (currentRead as any).value,
            });
          }
        }
        ongoing = transformedFinalOngoing;
      }
    }

    this.logger.verbose(
      'count of ong reads:::::::::::::::::::::::::::::::::::' +
        (await this.getnumberOfOngReads(
          filter.start,
          filter.end,
          externalId,
          deviceOnboarded,
        )),
    );
    if (typeof pageNumber === 'number' && !isNaN(pageNumber)) {
      return {
        historyread,
        ongoing,
        numberOfReads: numberOfReads,
        numberOfPages: numberOfPages,
        currentPageNumber: pageNumber,
      };
    } else {
      return {
        historyread,
        ongoing,
        numberOfReads: numberOfReads,
        numberOfPages: numberOfPages,
        currentPageNumber: 1,
      };
    }
  }

  async getnumberOfHistReads(deviceId, startDate, endDate) {
    const query = this.historyrepository
      .createQueryBuilder('devicehistory')
      .where('devicehistory.externalId = :deviceId', { deviceId })
      .andWhere('devicehistory.readsStartDate <= :endDate', { endDate })
      .andWhere('devicehistory.readsEndDate >= :startDate', { startDate });

    const count = await query.getCount();
    return count;
  }

  async getnumberOfOngReads(
    start: Date,
    end: Date,
    externalId,
    onboarded: Date,
  ) {
    this.logger.verbose(externalId);
    if (new Date(onboarded).getTime() > new Date(end).getTime()) {
      this.logger.verbose('The given dates are not for on-going reads');
      return 0;
    }
    let fluxquery = ``;
    if (new Date(start).getTime() > new Date(onboarded).getTime()) {
      fluxquery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r._measurement == "read" and r.meter == "${externalId}")
  |> count()`;
    } else {
      fluxquery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
  |> range(start: ${onboarded}, stop: ${end})
  |> filter(fn: (r) => r._measurement == "read"and r.meter == "${externalId}")
  |> count()`;
    }
    const noOfReads = await this.ongExecute(fluxquery);

    return noOfReads;
  }

  async ongExecute(query: any) {
    const data: any = await this.dbReader.collectRows(query);
    if (typeof data[0] === 'undefined' || data.length == 0) {
      this.logger.verbose('type of data is undefined');
      return 0;
    }
    return Number(data[0]._value);
  }

  async latestread(meterId, deviceOnboarded) {
    const query = `
from(bucket: "${process.env.INFLUXDB_BUCKET}")
|> range(start: ${deviceOnboarded}, stop: now())
|> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
|> last()
`;

    return await this.execute(query);
  }
  /* */

  async getAccumulatedReads(
    meter: string,
    organizationId,
    developerExternalId,
    accumulationType,
    month: number,
    year: number,
  ) {
    let startDate;
    let numberOfDays;
    let endDate;
    if (month && year) {
      startDate = this.convertToISODate(month, year);
      numberOfDays = this.getNumberOfDaysInMonth(month, year);
      endDate =
        DateTime.fromISO(startDate)
          .plus({ days: numberOfDays })
          .minus({ seconds: 1 })
          .toISODate() + 'T00:00:00Z';
    }
    if (year && !month) {
      month = 1;
      startDate = this.convertToISODate(month, year);
      this.logger.verbose('startDate for year:::::::::::::' + startDate);

      endDate =
        DateTime.fromISO(startDate)
          .plus({ years: 1 })
          .minus({ seconds: 1 })
          .toISO({ suppressMilliseconds: true, includeOffset: false }) + 'Z';
    }
    this.logger.verbose('startDate::::::::::::' + startDate);
    this.logger.verbose('End DAte:::::::::::::' + endDate);

    meter = meter;
    let tempResults = [];
    const finalResults: { timestamp?: string; value?: any }[] = [];
    let response;
    let url;
    const offSet = await this.getOffSetForInfluxQuery(
      developerExternalId,
      organizationId,
      startDate,
    );
    this.logger.verbose('THE OFFSET RETURNED:::' + offSet);

    const formattedOffSet = offSet.formattedOffset;

    const monthlyQuery = `SELECT time, SUM("read") AS total_meter_reads FROM "read" WHERE time >= '${startDate}' AND time < '${endDate}'  AND meter = '${meter}'GROUP BY time(1d,${formattedOffSet})`;
    const yearlyQuery = `SELECT time, SUM("read") AS total_meter_reads FROM "read" WHERE time >= '${startDate}' AND time < '${endDate}'  AND meter = '${meter}'GROUP BY time(30d,${formattedOffSet})`;
    this.logger.verbose(
      'accumulation type:::::::::::::::::' + accumulationType,
    );
    if (accumulationType === 'Monthly' && month && year) {
      url = `${process.env.INFLUXDB_URL}/query?db=${process.env.INFLUXDB_DB}&q=${monthlyQuery}`;
    } else if (accumulationType === 'Yearly' && year) {
      url = `${process.env.INFLUXDB_URL}/query?db=${process.env.INFLUXDB_DB}&q=${yearlyQuery}`;
    } else {
      throw new HttpException(
        'Invalid accumulationType',
        HttpStatus.BAD_REQUEST,
      );
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
      tempResults = this.readFilterNullUndefined(
        response.data.results[0].series[0].values,
      );
    } catch (error) {
      this.logger.error(error);
      throw error;
    }

    for (let i = 0; i < tempResults.length; i++) {
      const resultObj: { startTime?: string; endTime?: string; value?: any } =
        {};
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
    this.logger.verbose(finalResults);
    return {
      aggregateType: accumulationType,
      accumulatedReads: finalResults,
      timezone: offSet.localTimeZone,
    };
  }

  readFilterNullUndefined(arr) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < 2; j++) {
        if (j % 2 != 0) {
          if (arr[i][j] == null || arr[i][j] == undefined) {
            arr[i][j] = 0;
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
      zone: 'utc',
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
      second: 0,
    }).daysInMonth;
  }

  async getPaginatedData(
    meter: string,
    filter: any,
    page: number,
  ): Promise<unknown[]> {
    this.logger.verbose('page: ' + page);
    const pageSize = filter.limit;
    const skipCount = (page - 1) * pageSize;
    const data = await this.retrieveDataWithLastValue(
      meter,
      filter,
      skipCount,
      pageSize,
    );
    this.logger.verbose(`data: ${data}`);
    return data;
  }

  async retrieveDataWithLastValue(
    meter: string,
    filter: any,
    skipCount: number,
    pageSize: number,
  ): Promise<unknown[]> {
    let currentQuery: string;

    if (filter.lastValue) {
      const newDateTime = new Date(
        new Date(filter.lastValue).getTime() + 1000,
      ).toISOString();
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
  async getOffSetForInfluxQuery(
    developerExternalId,
    organizationId,
    startDate,
  ) {
    let localTime = null;
    let formattedOffset = null;
    const device = await this.deviceService.findDeviceByDeveloperExternalId(
      developerExternalId,
      organizationId,
    );

    if (device.latitude && device.longitude) {
      localTime = getLocalTime(startDate, device);
    }

    const localTimeZone = getLocalTimeZoneFromDevice(localTime, device);
    const localTimeZoneName = localTimeZone;
    const nonFormattedOffSet = getOffsetFromTimeZoneName(localTimeZoneName);
    const offset = getFormattedOffSetFromOffsetAsJson(nonFormattedOffSet);
    const offSetHoursString = offset.hours.toString();
    const offSetMinutesString = offset.minutes.toString();

    formattedOffset = offSetHoursString + 'h' + offSetMinutesString + 'm';

    this.logger.verbose('FORMATTED OFFSET BEING RETURNED:::' + formattedOffset);

    return {
      formattedOffset: formattedOffset,
      offSetHours: offset.hours,
      offSetMinutes: offset.minutes,
      localTimeZone: localTimeZoneName,
    };
  }

  async getOngoingReads(meter, filter): Promise<any> {
    this.logger.verbose('IN THE FUNCTION TO GET ONGOING READS');

    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;
    const queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    this.logger.verbose('filter.start:::::::' + filter);
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}") |> range(start:${filter.start} , stop:${filter.end} ) |> filter(fn: (r) => r.meter == "${meter}" and r._field == "read") |> limit(n:${filter.limit} , offset:${filter.offset})`;
    const result = await queryApi.collectRows(fluxQuery);
    this.logger.verbose(result);
    this.logger.verbose('\ncollect-rows query SUCCESS');
    return result;
  }
}
