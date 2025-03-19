import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Brackets,
  FindConditions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import {
  Aggregate,
  AggregatedReadDTO,
  AggregateFilterDTO,
  FilterDTO,
  MeasurementDTO,
  ReadDTO,
  ReadsService as BaseReadsService,
  Unit,
} from '@energyweb/energy-api-influxdb';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { InfluxDB, Point, QueryApi } from '@influxdata/influxdb-client';
import { EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { BigNumber } from 'ethers';
import { DeviceDTO } from '../device/dto';
import { DeviceGroupService } from '../device-group/device-group.service';
import { AggregateMeterRead } from './aggregate_readvalue.entity';
import { flattenDeep, values, groupBy, mean, sum } from 'lodash';
import { DeltaFirstRead } from './delta_firstread.entity';
import { DateTime } from 'luxon';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import { writePoints } from '../../lib/influx-db';
import { IAggregateIntermediate } from '../../models';
import { HistoryNextIssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { convertToWh } from '../../utils/convert-to-power-units';
import {
  getFormattedOffSetFromOffsetAsJson,
  getLocalTime,
  getLocalTimeZoneFromDevice,
  getOffsetFromTimeZoneName,
} from '../../utils/localTimeDetailsForDevice';
import { DeviceService } from '../device/device.service';
import { OrganizationService } from '../organization/organization.service';
import { BASE_READ_SERVICE } from './constants';
import {
  AccumulationType,
  FilterNoOffLimit,
} from './dto/filter-no-off-limit.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NewIntermediateMeterReadDTO } from './dto/intermediate_meter_read.dto';
import { HistoryIntermediateMeterRead } from './history_intermideate_meterread.entity';
import { BulkUploadType } from '../bulk-upload/bulk-uploads.entity';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { ReadType } from '../../utils/enums';
import * as momentTimeZone from 'moment-timezone';
import {
  toTimezoneDate,
  toTimezoneDateFormat,
} from '../../transformers/timezone';
import { validateTimezone } from '../../validations/timezone';
import { Queues } from '../../utils/enums/queues.enum';
import { computeMaxEnergyCapacity } from '../../lib/meter-read';
import {
  DEFAULT_YIELD_VALUE,
  DEVICE_DEGRADATION,
  DEVICE_DEGRADATION_PERCENTAGE,
  INFLUX_DB_TIMEOUT,
} from '../../constants';

export type TUserBaseEntity = ExtendedBaseEntity & IAggregateIntermediate;
@Injectable()
export class ReadsService {
  public readonly logger = new Logger(ReadsService.name);
  private readonly influxDB: InfluxDB;
  private readonly queryApi: QueryApi;

  constructor(
    @InjectRepository(AggregateMeterRead)
    private readonly repository: Repository<AggregateMeterRead>,
    @InjectRepository(HistoryIntermediateMeterRead)
    private readonly historyRepository: Repository<HistoryIntermediateMeterRead>,
    @InjectRepository(DeltaFirstRead)
    private readonly deltaFirstReadRepository: Repository<DeltaFirstRead>,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
    private readonly deviceService: DeviceService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly organizationService: OrganizationService,
    private readonly eventBus: EventBus,
    @InjectQueue(Queues.ReadsBulkUpload) private readsQueue: Queue,
  ) {
    const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;
    this.influxDB = new InfluxDB({ url, token, timeout: INFLUX_DB_TIMEOUT });
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

    return readsGroupedBySameDates.map(
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
  }

  async storeFailedReads(
    meterId: string,
    read: number,
    timeStamp: Date,
    unit: Unit,
  ): Promise<void> {
    const readInWh = convertToWh(read, unit);

    const points: Point[] = [
      new Point('failed_reads')
        .tag('meter', meterId)
        .intField('read', readInWh)
        .timestamp(new Date(timeStamp)),
    ];
    await writePoints(points);
  }

  async bulkUploadJobProcessing(
    s3Key: string,
    fileId: string,
    bulkUploadType: BulkUploadType,
  ): Promise<string> {
    try {
      const job = await this.readsQueue.add({
        s3Key: s3Key,
        fileId: fileId,
        bulkUploadType: bulkUploadType,
      });
      return job.id.toString();
    } catch (error) {
      this.logger.error('Job processing failed:', error);
      throw error;
    }
  }

  private async store(id: string, measurements: MeasurementDTO): Promise<void> {
    return await this.baseReadsService.store(id, measurements);
  }

  public findLastRead(deviceId: string): Promise<AggregateMeterRead[]> {
    return this.repository.find({
      where: { externalId: deviceId },
      order: {
        id: 'DESC',
      },
      take: 1,
    });
  }

  public async storeRead(
    id: string,
    measurements: NewIntermediateMeterReadDTO,
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
      await this.deviceService.updateTimezone(
        device.externalId,
        measurements.timezone,
      );
    }

    const roundedMeasurements = this.roundMeasurementsToUnit(measurements);

    const filteredMeasurements = await this.filterMeasurements(
      id,
      roundedMeasurements,
      device,
    );
    this.logger.verbose(filteredMeasurements);
    await this.storeGenerationReading(id, filteredMeasurements, device);
  }

  private roundMeasurementsToUnit(
    measurement: NewIntermediateMeterReadDTO,
  ): NewIntermediateMeterReadDTO {
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

  private async filterMeasurements(
    deviceId: string,
    measurement: NewIntermediateMeterReadDTO,
    device: DeviceDTO,
  ): Promise<MeasurementDTO> {
    const final = await this.findLatestRead(deviceId, device.createdAt);
    this.logger.verbose(`final: ${final}`);
    const reads: any = [];
    if (measurement.type === 'History') {
      await new Promise((resolve, reject) => {
        measurement.reads.forEach(async (element, measurementReadIndex) => {
          const requestStartDate = DateTime.fromISO(
            new Date(element.starttimestamp).toISOString(),
          );
          const requestCurrentEnd = DateTime.fromISO(
            new Date(element.endtimestamp).toISOString(),
          );
          const meteredTimePeriod = Math.abs(
            requestStartDate.diff(requestCurrentEnd, ['hours']).toObject()
              ?.hours || 0,
          );

          const checkHistoryReading = await this.checkHistoryReadExist(
            device.externalId,
            element.starttimestamp,
            element.endtimestamp,
          );
          const historyAge = new Date(device.createdAt);
          historyAge.setFullYear(historyAge.getFullYear() - 3);
          this.logger.verbose('historyAge');

          if (checkHistoryReading) {
            this.storeFailedReads(
              device.externalId,
              element.value,
              element.endtimestamp,
              measurement.unit,
            );
            return reject(
              new ConflictException({
                success: false,
                message: `There are already one or more historical entries for this device which are conflicting current reading start date and/or end date `,
              }),
            );
          }

          if (
            requestStartDate <=
              DateTime.fromISO(new Date(historyAge).toISOString()) ||
            requestStartDate >=
              DateTime.fromISO(new Date(device?.createdAt).toISOString()) ||
            requestCurrentEnd <=
              DateTime.fromISO(new Date(historyAge).toISOString()) ||
            requestCurrentEnd >=
              DateTime.fromISO(new Date(device?.createdAt).toISOString())
          ) {
            this.storeFailedReads(
              device.externalId,
              element.value,
              element.endtimestamp,
              measurement.unit,
            );
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
          const historyValidation = await this.historyValidateEnergy(
            read,
            device,
            meteredTimePeriod,
            measurement,
            requestStartDate.toJSDate(),
            requestCurrentEnd.toJSDate(),
          );
          this.logger.verbose(historyValidation);
          if (historyValidation) {
            reads.push({
              timestamp: new Date(element.endtimestamp),
              value: element.value,
            });
          } else {
            this.logger.verbose('436');
            this.storeFailedReads(
              device.externalId,
              element.value,
              element.endtimestamp,
              measurement.unit,
            );
            return reject(
              new ConflictException({
                success: false,
                message: 'Failed,read value is greater than from MaxEnergy',
              }),
            );
          }
          if (measurementReadIndex == measurement.reads.length - 1) {
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
          measurement.reads.forEach(async (element, measurementReadIndex) => {
            if (final && final['timestamp']) {
              if (
                new Date(element.endtimestamp).getTime() <
                new Date(final.timestamp).getTime()
              ) {
                this.storeFailedReads(
                  device.externalId,
                  element.value,
                  element.endtimestamp,
                  measurement.unit,
                );
                return reject(
                  new ConflictException({
                    success: false,
                    message: `The sent date for reading ${element.endtimestamp} is less than last sent meter read date ${final.timestamp}`,
                  }),
                );
              }
            }

            reads.push({
              timestamp: new Date(element.endtimestamp),
              value: element.value,
            });
            await this.deltaFirstReadRepository.save({
              readsvalue: element.value,
              externalId: deviceId,
              unit: measurement.unit,
              readsEndDate: element.endtimestamp.toString(),
            });
            if (measurementReadIndex == measurement.reads.length - 1) {
              resolve(true);
            }
          });
        });
        await this.deviceService.updateReadType(deviceId, measurement.type);
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
            measurement.reads.forEach((element, measurementReadIndex) => {
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
                  this.storeFailedReads(
                    device.externalId,
                    element.value,
                    element.endtimestamp,
                    measurement.unit,
                  );
                  return reject(
                    new ConflictException({
                      success: false,
                      message: `The sent date for reading ${element.endtimestamp} is less than last sent meter read date ${final.timestamp.toISOString()}`,
                    }),
                  );
                }
              }

              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: element.value,
              };
              const deltaValidation = this.validateEnergy(read, final, device);
              if (deltaValidation.success) {
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: element.value,
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: deltaValidation.message,
                  }),
                );
              }
              if (measurementReadIndex == measurement.reads.length - 1) {
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
          measurement.reads.forEach(async (element, measurementReadIndex) => {
            const lastValue = await this.findLastRead(deviceId);
            let delta = 0;
            if (lastValue.length > 0) {
              delta = Math.abs(element.value - lastValue[0].value);

              if (
                new Date(element.endtimestamp).getTime() <
                  new Date(lastValue[0].datetime).getTime() ||
                element.value <= lastValue[0].value
              ) {
                this.storeFailedReads(
                  device.externalId,
                  element.value,
                  element.endtimestamp,
                  measurement.unit,
                );
                return reject(
                  new ConflictException({
                    success: false,
                    message: `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent meter read date/value ${lastValue[0].datetime}/${lastValue[0].value} `,
                  }),
                );
              }

              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: delta,
              };
              const firstValidation = this.firstValidateEnergy(read, device);
              if (firstValidation.success) {
                await this.repository.save({
                  value: element.value,
                  deltaValue: delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString(),
                });
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: delta,
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: firstValidation.message,
                  }),
                );
              }
            } else {
              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: element.value,
              };
              const firstValidation = this.firstValidateEnergy(read, device);
              if (firstValidation.success) {
                await this.repository.save({
                  value: element.value,
                  deltaValue: delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString(),
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: firstValidation.message,
                  }),
                );
              }
            }
            if (measurementReadIndex == measurement.reads.length - 1) {
              resolve(true);
            }
          });
        });
        await this.deviceService.updateReadType(deviceId, measurement.type);
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
          measurement.reads.forEach(async (element, measurementReadIndex) => {
            const lastValue = await this.findLastRead(deviceId);
            let delta;
            if (lastValue.length > 0) {
              delta = Math.abs(element.value - lastValue[0].value);
              if (
                new Date(element.endtimestamp).getTime() <
                  new Date(lastValue[0].datetime).getTime() ||
                element.value <= lastValue[0].value
              ) {
                return reject(
                  new ConflictException({
                    success: false,
                    message: `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent mter read date/value ${lastValue[0].datetime}/${lastValue[0].value} `,
                  }),
                );
              }

              const read: ReadDTO = {
                timestamp: new Date(element.endtimestamp),
                value: delta,
              };
              const validation = this.validateEnergy(read, final, device);
              if (validation.success) {
                reads.push({
                  timestamp: new Date(element.endtimestamp),
                  value: delta,
                });
                await this.repository.save({
                  value: element.value,
                  deltaValue: delta,
                  externalId: deviceId,
                  unit: measurement.unit,
                  datetime: element.endtimestamp.toString(),
                });
              } else {
                return reject(
                  new ConflictException({
                    success: false,
                    message: validation.message,
                  }),
                );
              }
            }
            if (measurementReadIndex == measurement.reads.length - 1) {
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

  async findLatestRead(
    meterId: string,
    deviceRegistrationDate: Date,
  ): Promise<ReadDTO | void> {
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${deviceRegistrationDate}, stop: now())
    |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
    |> last()`;
    const reads = await this.execute(fluxQuery);
    return reads[0];
  }

  async findLastReadForMeterWithinRange(
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
    |> range(start: ${new Date(startDate).toISOString()}, stop: ${new Date(endDate).toISOString()})
    |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
    |> last()
    `;

    return await this.execute(fluxQuery);
  }

  async execute(query: string | any): Promise<any> {
    const data = await this.dbReader.collectRows(query);
    return data.map((record: any) => ({
      timestamp: new Date(record._time),
      value: Number(record._value),
    }));
  }
  get dbReader(): any {
    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
    const org = process.env.INFLUXDB_ORG;

    return new InfluxDB({ url, token, timeout: INFLUX_DB_TIMEOUT }).getQueryApi(
      org,
    );
  }

  private async checkHistoryReadExist(
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const query = this.getExistingHistoryDeviceLogFilteredQuery(
      deviceId,
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
  private getExistingHistoryDeviceLogFilteredQuery(
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<HistoryIntermediateMeterRead> {
    this.logger.verbose(startDate);
    this.logger.verbose(endDate);

    return this.historyRepository
      .createQueryBuilder('devicehistory')
      .where('devicehistory.externalId = :deviceId', { deviceId })
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
  }
  private firstValidateEnergy(
    read: ReadDTO,
    device: DeviceDTO,
  ): { success: boolean; message: string } {
    this.logger.debug(JSON.stringify(read));
    const yieldValue = device.yieldValue || DEFAULT_YIELD_VALUE; // [kWh/kW]
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

    const maxEnergy = computeMaxEnergyCapacity(
      capacity,
      meteredTimePeriod,
      deviceAge,
      DEVICE_DEGRADATION_PERCENTAGE,
      yieldValue,
    );
    const finalMax = maxEnergy * (120 / 100);
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${DEVICE_DEGRADATION}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < finalMax ? 'Passed' : 'Failed'}, MaxEnergy: ${finalMax}`,
    );
    this.logger.verbose(`hgfgfdt871, ${Math.round(read.value)}`);
    if (read.value < finalMax) {
      return {
        success: true,
        message: 'Validation successful',
      };
    } else {
      return {
        success: false,
        message: `Failed, MaxEnergy: ${finalMax}`,
      };
    }
  }
  private validateEnergy(
    read: ReadDTO,
    final: ReadDTO,
    device: DeviceDTO,
  ): { success: boolean; message: string } {
    const yieldValue = device.yieldValue || DEFAULT_YIELD_VALUE; // [kWh/kW]
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
    const maxEnergy = computeMaxEnergyCapacity(
      capacity,
      meteredTimePeriod,
      deviceAge,
      DEVICE_DEGRADATION_PERCENTAGE,
      yieldValue,
    );
    const finalMax = maxEnergy * (120 / 100);
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${DEVICE_DEGRADATION}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < finalMax ? 'Passed' : 'Failed'}, MaxEnergy: ${finalMax}`,
    );
    if (read.value < finalMax) {
      return {
        success: true,
        message: 'Validation successful',
      };
    } else {
      return {
        success: false,
        message: `Failed, MaxEnergy: ${finalMax}`,
      };
    }
  }

  async historyValidateEnergy(
    read: ReadDTO,
    device: DeviceDTO,
    requestedMeteredTimePeriod: number,
    measurement: NewIntermediateMeterReadDTO,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    this.logger.debug(JSON.stringify(read));
    const yieldValue = device.yieldValue || DEFAULT_YIELD_VALUE; // [kWh/kW]
    const capacity = device.capacity * 1000; // capacity in KilloWatt and read in Wh so coverting in Watt
    const commissioningDate = DateTime.fromISO(device.commissioningDate);
    const currentDate = DateTime.now();
    let deviceAge =
      currentDate.diff(commissioningDate, ['years']).toObject().years || 0; // years
    if (deviceAge <= 0) {
      deviceAge = 1;
    }
    const meteredTimePeriod = requestedMeteredTimePeriod;
    const maxEnergy = computeMaxEnergyCapacity(
      capacity,
      meteredTimePeriod,
      deviceAge,
      DEVICE_DEGRADATION_PERCENTAGE,
      yieldValue,
    );
    const finalMax = maxEnergy * (120 / 100);
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${DEVICE_DEGRADATION}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < finalMax ? 'Passed' : 'Failed'}, MaxEnergy: ${finalMax}`,
    );

    if (read.value < finalMax) {
      this.historyRepository.save({
        type: measurement.type,
        externalId: device.externalId,
        unit: measurement.unit,
        readsvalue: read.value,
        readsStartDate: startDate,
        readsEndDate: endDate,
      });
      this.logger.verbose('1267');
      if (device.groupId != null) {
        const historyNextIssue =
          await this.deviceGroupService.getNextHistoryIssuanceDeviceLogAfterReservation(
            device.externalId,
            device.groupId,
          );
        this.logger.verbose('historynextissue');
        if (historyNextIssue != undefined) {
          const startTimestamp = new Date(startDate).getTime();
          const endTimestamp = new Date(endDate).getTime();
          const reservedStartDate = new Date(
            historyNextIssue.reservationStartDate,
          ).getTime();
          this.logger.verbose(reservedStartDate);
          const reservedEndDate = new Date(
            historyNextIssue.reservationEndDate,
          ).getTime();
          this.logger.verbose(reservedEndDate);
          this.logger.verbose(
            startTimestamp >= reservedStartDate &&
              startTimestamp < reservedEndDate,
          );
          this.logger.verbose(
            endTimestamp <= reservedEndDate && endTimestamp > reservedStartDate,
          );
          if (
            startTimestamp >= reservedStartDate &&
            startTimestamp < reservedEndDate &&
            endTimestamp <= reservedEndDate &&
            endTimestamp > reservedStartDate
          ) {
            this.deviceGroupService.updateHistoryCertificateIssueDate(
              historyNextIssue.id,
              HistoryNextIssuanceStatus.Pending,
            );
          }
        }
      }
      return read.value < finalMax;
    } else {
      return false;
    }
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

  private aggregateArray(aggregate: Aggregate, array: number[]): number {
    switch (aggregate) {
      case Aggregate.Mean:
        return Math.floor(mean(array));
      case Aggregate.Sum:
        return Math.floor(sum(array));
    }
  }
  public async getCheckHistoryCertificateIssueDateLogForDevice(
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HistoryIntermediateMeterRead[]> {
    const query = this.getHistoryDeviceLogFilteredQuery(
      deviceId,
      startDate,
      endDate,
    );

    try {
      const device = await query.getRawMany();
      return device.map((s: any) => {
        const item: any = {
          id: s.devicehistory_id,
          readsStartDate: s.devicehistory_readsStartDate,
          readsEndDate: s.devicehistory_readsEndDate,
          readsvalue: s.devicehistory_readsvalue,
          externalId: s.devicehistory_externalId,
        };
        return item;
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve device`, error.stack);
    }
  }

  private getHistoryDeviceLogFilteredQuery(
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<HistoryIntermediateMeterRead> {
    return this.historyRepository
      .createQueryBuilder('devicehistory')
      .where('devicehistory.externalId = :deviceId', { deviceId })
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
  }

  async getDeviceHistoryCertificateIssueDate(
    conditions: FindConditions<HistoryIntermediateMeterRead>,
  ): Promise<HistoryIntermediateMeterRead | null> {
    return (await this.historyRepository.findOne(conditions)) ?? null;
  }
  async updateHistoryCertificateIssueDate(
    id: number,
    startDate: Date,
    endDate: Date,
  ): Promise<HistoryIntermediateMeterRead> {
    const historyDevice = await this.getDeviceHistoryCertificateIssueDate({
      id: id,
    });
    let updatedHistoryIssue = new HistoryIntermediateMeterRead();
    if (historyDevice) {
      historyDevice.certificate_issuance_startdate = startDate;
      historyDevice.certificate_issuance_enddate = endDate;
      historyDevice.certificate_issued = true;
      updatedHistoryIssue = await this.historyRepository.save(historyDevice);
    }
    return updatedHistoryIssue;
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
    return this.deltaFirstReadRepository.find({
      where: {
        externalId: meterId,
      },
    });
  }

  /* */

  timeOffset: any;
  async getAllRead(
    externalId: string,
    filter: FilterNoOffLimit,
    deviceOnboarded: Date,
    pageNumber: number,
  ): Promise<any> {
    if (new Date(filter.start).getTime() == new Date(filter.end).getTime()) {
      throw new HttpException(
        'The given start and end timestamps are the same',
        400,
      );
    }
    const historyReads = [];
    let ongoing = [];
    this.logger.verbose(
      'page number:::::::::::::::::::::::::::::::::::::::::::' + pageNumber,
    );

    const sizeOfPage = 5;
    let numberOfPages = 0;
    const numberOfHistoryReads = await this.getNumberOfHistoryReads(
      externalId,
      filter.start,
      filter.end,
    );
    let numberOfOngReads = 0;
    let numberOfReads = numberOfHistoryReads + numberOfOngReads;
    if (numberOfHistoryReads > 0) {
      numberOfPages = Math.ceil(numberOfHistoryReads / sizeOfPage);
    }

    if (typeof pageNumber === 'number' && !isNaN(pageNumber)) {
      filter.offset = sizeOfPage * (pageNumber - 1);
      filter.limit = sizeOfPage;
    }
    numberOfOngReads = await this.getNumberOfOngoingReads(
      filter.start,
      filter.end,
      externalId,
      deviceOnboarded,
    );
    this.logger.verbose(numberOfOngReads);
    if (numberOfOngReads > numberOfHistoryReads) {
      numberOfPages = Math.ceil(numberOfOngReads / sizeOfPage);
    }
    numberOfReads = numberOfHistoryReads + numberOfOngReads;
    if (numberOfHistoryReads == 0 && numberOfOngReads == 0) {
      return {
        historyread: historyReads,
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
        historyread: historyReads,
        ongoing,
        numberOfReads: numberOfReads,
        numberOfPages: numberOfPages,
        currentPageNumber: 1,
      };
    }

    if (
      new Date(filter.start).getTime() <= new Date(deviceOnboarded).getTime()
    ) {
      const query = await this.getExistingHistoryDeviceLogFilteredQuery(
        externalId,
        filter.start,
        filter.end,
      );

      this.logger.verbose(
        'history query executed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
      );
      this.logger.verbose('historyexistdevicequery');
      try {
        const rawHistoryReads = await query
          .limit(filter.limit)
          .offset(filter.offset)
          .getRawMany();

        await rawHistoryReads.forEach((element) => {
          historyReads.push({
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
          start: deviceOnboarded.toString(),
          end: filter.end.toString(),
        };
      }
      if (
        new Date(filter.start).getTime() <
          new Date(deviceOnboarded).getTime() ||
        new Date(filter.end).getTime() > new Date(deviceOnboarded).getTime()
      ) {
        const finalOngoingRead = await this.getPaginatedData(
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
              'previous page read data[0]::::' +
                (previousPageData[0] as any).timestamp,
            );
          } else {
            previousReadTime = null;
          }
        }
        const transformedFinalOngoing = [];
        for (let i = 0; i < finalOngoingRead.length; i++) {
          const currentRead = finalOngoingRead[i];
          let startDate;
          if (i === 0 && pageNumber == 1) {
            startDate = new Date(
              Math.max(
                new Date(deviceOnboarded).getTime(),
                new Date(filter.start).getTime(),
              ),
            );
          } else if (i == 0 && pageNumber != 1) {
            startDate = previousReadTime;
          } else {
            startDate = transformedFinalOngoing[i - 1].enddate;
          }
          const endDate = (finalOngoingRead[i] as any).timestamp;
          if (i > 1) {
            transformedFinalOngoing.push({
              startdate: transformedFinalOngoing[i - 1].enddate,
              enddate: endDate,
              value: (currentRead as any).value,
            });
          } else {
            transformedFinalOngoing.push({
              startdate: startDate,
              enddate: endDate,
              value: (currentRead as any).value,
            });
          }
        }
        ongoing = transformedFinalOngoing;
      }
    }

    this.logger.verbose(
      'count of ong reads:::::::::::::::::::::::::::::::::::' +
        (await this.getNumberOfOngoingReads(
          filter.start,
          filter.end,
          externalId,
          deviceOnboarded,
        )),
    );
    if (typeof pageNumber === 'number' && !isNaN(pageNumber)) {
      return {
        historyread: historyReads,
        ongoing,
        numberOfReads: numberOfReads,
        numberOfPages: numberOfPages,
        currentPageNumber: pageNumber,
      };
    } else {
      return {
        historyread: historyReads,
        ongoing,
        numberOfReads: numberOfReads,
        numberOfPages: numberOfPages,
        currentPageNumber: 1,
      };
    }
  }

  async getNumberOfHistoryReads(
    deviceId: string,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<any> {
    const query = this.historyRepository
      .createQueryBuilder('devicehistory')
      .where('devicehistory.externalId = :deviceId', { deviceId })
      .andWhere('devicehistory.readsStartDate <= :endDate', { endDate })
      .andWhere('devicehistory.readsEndDate >= :startDate', { startDate });

    return await query.getCount();
  }

  async getNumberOfOngoingReads(
    start: Date,
    end: Date,
    externalId: string,
    onboarded: Date,
  ): Promise<number> {
    this.logger.verbose(externalId);
    if (new Date(onboarded).getTime() > new Date(end).getTime()) {
      this.logger.verbose('The given dates are not for on-going reads');
      return 0;
    }
    let fluxQuery = ``;
    if (new Date(start).getTime() > new Date(onboarded).getTime()) {
      fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r._measurement == "read" and r.meter == "${externalId}")
  |> count()`;
    } else {
      fluxQuery = `from(bucket: "${process.env.INFLUXDB_BUCKET}")
  |> range(start: ${onboarded}, stop: ${end})
  |> filter(fn: (r) => r._measurement == "read"and r.meter == "${externalId}")
  |> count()`;
    }
    return await this.ongExecute(fluxQuery);
  }

  async ongExecute(query: string | any): Promise<number> {
    const data: any = await this.dbReader.collectRows(query);
    if (typeof data[0] === 'undefined' || data.length == 0) {
      this.logger.verbose('type of data is undefined');
      return 0;
    }
    return Number(data[0]._value);
  }

  async latestRead(meterId: string, deviceOnboarded: Date): Promise<any> {
    try {
      const query = `
        from(bucket: "${process.env.INFLUXDB_BUCKET}")
        |> range(start: ${deviceOnboarded}, stop: now())
        |> filter(fn: (r) => r.meter == "${meterId}" and r._field == "read")
        |> last()
        `;
      return await this.execute(query);
    } catch (error) {
      this.logger.error(
        `Error in influxdb query: ${error.message}`, //Please include the whole stack
        error.stack,
      );
    }
  }

  async getAccumulatedReads(
    meter: string,
    organizationId: number,
    developerExternalId: string,
    accumulationType: AccumulationType,
    month: number,
    year: number,
  ): Promise<{
    aggregateType: any;
    accumulatedReads: {
      timestamp?: string;
      value?: any;
    }[];
    timezone: any;
  }> {
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
          const startTimestamp = new Date(tempResults[i][j]).getTime();
          const startDate = new Date(startTimestamp);
          resultObj.startTime = startDate.toISOString();
        } else {
          resultObj.value = tempResults[i][j];
          if (i < tempResults.length - 1) {
            const endTimestamp = new Date(tempResults[i + 1][j - 1]).getTime();
            const endDate = new Date(endTimestamp);
            resultObj.endTime = endDate.toISOString();
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

  readFilterNullUndefined(arr: [any]): any {
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

  convertToISODate(month: number, year: number): any {
    return DateTime.fromObject({
      year: year,
      month: month,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      zone: 'utc',
    }).toISO({ suppressMilliseconds: true });
  }

  getNumberOfDaysInMonth(month: number, year: number): any {
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
    filter: FilterDTO | any,
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
    filter: FilterDTO | any,
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
    influxDB.getQueryApi(org); // eslint-disable-line @typescript-eslint/no-unused-vars
    const result = await influxDB.getQueryApi(org).collectRows(currentQuery);

    return result.map((record: any) => ({
      timestamp: new Date(record._time),
      value: Number(record._value),
    }));
  }

  //
  async getOffSetForInfluxQuery(
    developerExternalId: string,
    organizationId: number,
    startDate: string | any,
  ): Promise<{
    formattedOffset: any;
    offSetHours: number;
    offSetMinutes: number;
    localTimeZone: any;
  }> {
    let localTime = null;
    let formattedOffset = null;
    const device = await this.deviceService.findDeviceByDeveloperExternalId(
      developerExternalId,
      organizationId,
    );

    if (device.latitude && device.longitude) {
      localTime = getLocalTime(startDate, device);
    }

    const localTimeZoneName = getLocalTimeZoneFromDevice(localTime, device);
    const nonFormattedOffSet = getOffsetFromTimeZoneName(localTimeZoneName);
    const offSet = getFormattedOffSetFromOffsetAsJson(nonFormattedOffSet);
    const offSetHoursString = offSet.hours.toString();
    const offSetMinutesString = offSet.minutes.toString();

    formattedOffset = offSetHoursString + 'h' + offSetMinutesString + 'm';

    this.logger.verbose('FORMATTED OFFSET BEING RETURNED:::' + formattedOffset);

    return {
      formattedOffset: formattedOffset,
      offSetHours: offSet.hours,
      offSetMinutes: offSet.minutes,
      localTimeZone: localTimeZoneName,
    };
  }

  async getOngoingReads(meter: string, filter: FilterDTO | any): Promise<any> {
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

  async validateAndStoreReads({
    deviceExternalId,
    measurements,
    organizationId,
  }: {
    deviceExternalId: string;
    measurements: NewIntermediateMeterReadDTO;
    organizationId: number;
  }): Promise<void> {
    if (
      deviceExternalId.trim() === '' &&
      deviceExternalId.trim() === undefined
    ) {
      this.logger.error(`id should not be empty`);
      throw new ConflictException({
        success: false,
        message: `id should not be empty`,
      });
    }

    const device: DeviceDTO | null =
      await this.deviceService.findDeviceByDeveloperExternalId(
        deviceExternalId,
        organizationId,
      );
    if (device === null) {
      this.logger.error(`Invalid device id`);
      throw new ConflictException({
        success: false,
        message: `Invalid device id`,
      });
    }

    if (measurements.timezone) {
      measurements.timezone = validateTimezone(measurements.timezone);

      measurements.reads = measurements.reads.map((read) => ({
        ...read,
        starttimestamp: toTimezoneDate(
          read.starttimestamp,
          measurements.timezone,
        ),
        endtimestamp: toTimezoneDate(read.endtimestamp, measurements.timezone),
      }));
      device.createdAt = toTimezoneDate(
        device.createdAt,
        measurements.timezone,
      );
      device.commissioningDate = toTimezoneDateFormat(
        device?.commissioningDate || new Date(),
        measurements.timezone,
      );
    }

    //check for according to read type if start time stamp and end time stamps are sent
    if (measurements.type === ReadType.History) {
      let datesContainingNullOrEmptyValues = false;
      let dateValid = true;
      let allDatesAreBeforeCreatedAt = true;
      let allStartDatesAreBeforeEndDate = true;
      let readValue = true;
      let historyAllStartDatesAreAfterCommissioningDate = true;
      let historyAllEndDatesAreAfterCommissioningDate = true;
      measurements.reads.forEach((ele) => {
        if (!ele.starttimestamp || !ele.endtimestamp) {
          datesContainingNullOrEmptyValues = true;
        }
        const startDateFormatted = isValidUTCDateFormat(
          new Date(ele.starttimestamp).toISOString(),
        );
        //dateFormattedToCheck.test(ele.starttimestamp);
        const endDateFormatted = isValidUTCDateFormat(
          new Date(ele.endtimestamp).toISOString(),
        );

        if (!startDateFormatted || !endDateFormatted) {
          dateValid = false;
        }
        if (device && device.createdAt) {
          if (
            new Date(ele.endtimestamp).getTime() >
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (
            new Date(ele.starttimestamp).getTime() >
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (
            new Date(ele.starttimestamp).getTime() >
            new Date(ele.endtimestamp).getTime()
          ) {
            allStartDatesAreBeforeEndDate = false;
          }
        }

        if (ele.value < 0) {
          readValue = false;
        }
        if (device && device.commissioningDate) {
          if (
            new Date(ele.starttimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            historyAllStartDatesAreAfterCommissioningDate = false;
          }
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            historyAllEndDatesAreAfterCommissioningDate = false;
          }
        }
      });

      if (datesContainingNullOrEmptyValues) {
        this.logger.error(
          `One ore more Start Date and End Date values are not sent for History, start and end date is required for History meter ready type`,
        );
        throw new ConflictException({
          success: false,
          message:
            'One ore more Start Date and End Date values are not sent for History, start and end date is required for History meter ready type',
        });
      }
      if (!dateValid) {
        this.logger.error(
          `Invalid Start Date and/or End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
        );
        throw new ConflictException({
          success: false,
          message:
            ' Invalid Start Date and/or End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
        });
      }
      if (!allStartDatesAreBeforeEndDate) {
        this.logger.error(
          `starttimestamp should be prior to endtimestamp. One or more measurements starttimestamp is greater than endtimestamp`,
        );
        throw new ConflictException({
          success: false,
          message: `starttimestamp should be prior to endtimestamp. One or more measurements starttimestamp is greater than endtimestamp `,
        });
      }
      if (!allDatesAreBeforeCreatedAt) {
        this.logger.error(
          `For History reading start timestamp and end timestamp should be prior to device onboarding date. One or more measurements endtimestamp and or start timestamp is greater than device OnBoarding Date ${device?.createdAt}`,
        );
        throw new ConflictException({
          success: false,
          message: `For History reading start timestamp and end timestamp should be prior to device onboarding date. One or more measurements endtimestamp and or start timestamp is greater than device OnBoarding Date ${device?.createdAt}`,
        });
      }

      if (!readValue) {
        this.logger.error(`meter read value should be greater then 0`);
        throw new ConflictException({
          success: false,
          message: `meter read value should be greater then 0 `,
        });
      }
      if (!historyAllStartDatesAreAfterCommissioningDate) {
        this.logger.error(
          `One or more measurements starttimestamp should be greater than to device Commissioning Date ${device?.commissioningDate}`,
        );
        throw new ConflictException({
          success: false,
          message: `One or more measurements starttimestamp should be greater than to device Commissioning Date ${device?.commissioningDate}`,
        });
      }
      if (!historyAllEndDatesAreAfterCommissioningDate) {
        this.logger.error(
          `One or more measurements endtimestamp should be greater than to device commissioningDate date ${device?.commissioningDate}`,
        );
        throw new ConflictException({
          success: false,
          message: `One or more measurements endtimestamp should be greater than to device commissioningDate date ${device?.commissioningDate}`,
        });
      }
    }
    if (
      measurements.type === ReadType.Delta ||
      measurements.type === ReadType.ReadMeter
    ) {
      this.logger.log('Line No: 505');
      let datesContainingNullOrEmptyValues = false;
      let dateValid1 = true;
      let allDatesAreAfterCreatedAt = true;
      let allDatesAreAfterCommissioningDate = true;
      let allEndDatesAreBeforeSystemDate = true;
      let endDate: any;
      let currentDate: Date = new Date();
      measurements.reads.forEach((ele) => {
        this.logger.log('Line No: 512');
        if (
          ele.endtimestamp instanceof Date &&
          (ele.endtimestamp === null ||
            ele.endtimestamp === undefined ||
            isNaN(ele.endtimestamp.getTime()))
        ) {
          datesContainingNullOrEmptyValues = true;
        }
        const endDateFormatted = isValidUTCDateFormat(
          new Date(ele.endtimestamp).toISOString(),
        );

        if (!endDateFormatted) {
          dateValid1 = false;
        }
        //check validation with onboarding date
        if (device && device.createdAt) {
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreAfterCreatedAt = false;
            endDate = ele.endtimestamp;
          }
        }
        //check validation with commissioning Date
        if (device && device.commissioningDate) {
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            allDatesAreAfterCommissioningDate = false;
            endDate = ele.endtimestamp;
          }
        }

        //check validation with System Date
        if (new Date(ele.endtimestamp).getTime() > new Date().getTime()) {
          allEndDatesAreBeforeSystemDate = false;
          endDate = ele.endtimestamp;
        }
      });
      if (datesContainingNullOrEmptyValues) {
        this.logger.error(
          `One ore more End Date values are not sent for ${measurements.type},  end date is required`,
        );
        throw new ConflictException({
          success: false,
          message: `One ore more End Date values are not sent for ${measurements.type},  end date is required`,
        });
      }
      if (!dateValid1) {
        this.logger.error(
          `Invalid  End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
        );
        throw new ConflictException({
          success: false,
          message:
            ' Invalid  End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
        });
      }
      if (
        measurements.timezone !== null &&
        measurements.timezone !== undefined &&
        measurements.timezone.toString().trim() !== ''
      ) {
        endDate = momentTimeZone.tz(endDate, measurements.timezone);
        currentDate = momentTimeZone
          .tz(currentDate, measurements.timezone)
          .toDate();
      }
      if (!allDatesAreAfterCreatedAt) {
        this.logger.error(
          `One or more measurements endtimestamp ${endDate} is less than or equal to device onboarding date ${device?.createdAt}`,
        );
        throw new ConflictException({
          success: false,
          message: `One or more measurements endtimestamp ${endDate} is less than or equal to device onboarding date ${device?.createdAt}`,
        });
      }
      if (!allDatesAreAfterCommissioningDate) {
        this.logger.error(
          `One or more measurements endtimestamp ${endDate} should be greater than to device commissioningDate date${device?.commissioningDate}`,
        );
        throw new ConflictException({
          success: false,
          message: `One or more measurements endtimestamp ${endDate} should be greater than to device commissioningDate date${device?.commissioningDate}`,
        });
      }
      if (!allEndDatesAreBeforeSystemDate) {
        this.logger.error(
          `One or more measurements endtimestamp ${endDate} is greater than current date ${currentDate}`,
        );
        throw new ConflictException({
          success: false,
          message: `One or more measurements endtimestamp ${endDate} is greater than current date ${currentDate}`,
        });
      }
    }

    // negative value validation
    if (
      measurements.type === ReadType.History ||
      measurements.type === ReadType.Delta
    ) {
      let readValue = true;
      measurements.reads.forEach((ele) => {
        if (ele.value <= 0) {
          readValue = false;
        }
      });
      if (!readValue) {
        this.logger.error(`meter read value should be greater then 0`);
        throw new ConflictException({
          success: false,
          message: `meter read value should be greater then 0 `,
        });
      }
    }
    // device organization and user organization validation
    if (device && device.organizationId !== organizationId) {
      this.logger.error(
        `Device doesnt belongs to the requested users organization`,
      );
      throw new ConflictException({
        success: false,
        message: `Device doesnt belongs to the requested users organization`,
      });
    }

    if (measurements.reads.length > 1) {
      this.logger.error(`can not allow multiple reads simultaneously`);
      throw new ConflictException({
        success: false,
        message: `can not allow multiple reads simultaneously `,
      });
    }
    return await this.storeRead(device.externalId, measurements);
  }
}
