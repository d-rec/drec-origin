import { FilterDTO } from '@energyweb/energy-api-influxdb';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Point } from '@influxdata/influxdb-client';
import { InjectQueue } from '@nestjs/bull';
import {
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Queue } from 'bull';
import { BigNumber } from 'ethers';
import { DateTime } from 'luxon';
import * as momentTimeZone from 'moment-timezone';
import {
  FindConditions,
  In,
  MoreThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { DEFAULT_YIELD_VALUE, DEVICE_DEGRADATION } from '../../constants';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import { writePoints } from '../../lib/influx-db';
import { computeMaxEnergyCapacity } from '../../lib/meter-read';
import { Profile } from '../../lib/profile';
import { IAggregateIntermediate } from '../../models';
import {
  toTimezoneDate,
  toTimezoneDateFormat,
} from '../../transformers/timezone';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { convertToWh } from '../../utils/convert-to-power-units';
import { ReadType } from '../../utils/enums';
import { HistoryNextIssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { Queues } from '../../utils/enums/queues.enum';
import { Unit } from '../../utils/enums/unit.enum';
import {
  getFormattedOffSetFromOffsetAsJson,
  getLocalTime,
  getLocalTimeZoneFromDevice,
  getOffsetFromTimeZoneName,
} from '../../utils/localTimeDetailsForDevice';
import { validateTimezone } from '../../validations/timezone';
import { BulkUploadType } from '../bulk-upload/bulk-uploads.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceService } from '../device/device.service';
import { DeviceDTO } from '../device/dto';
import { OrganizationService } from '../organization/organization.service';
import {
  AccumulationType,
  FilterNoOffLimit,
} from './dto/filter-no-off-limit.dto';
import { NewIntermediateMeterReadDTO } from './dto/intermediate_meter_read.dto';
import { MeasurementDTO, ReadDTO } from './dto/measurement.dto';
import { MeterRead } from './reads.entity';

export type TUserBaseEntity = ExtendedBaseEntity & IAggregateIntermediate;

@Injectable()
export class ReadsService {
  public readonly logger = new Logger(ReadsService.name);

  constructor(
    @InjectRepository(MeterRead)
    private readonly repository: Repository<MeterRead>,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    @Inject(forwardRef(() => DeviceGroupService))
    private readonly deviceGroupService: DeviceGroupService,
    private readonly organizationService: OrganizationService,
    private readonly eventBus: EventBus,
    @InjectQueue(Queues.ReadsBulkUpload) private readsQueue: Queue,
  ) {}

  @Profile()
  public async find(
    meterId: string,
    filter: FilterDTO,
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    try {
      const reads = await this.repository.find({
        where: { externalId: meterId },
        order: { endDate: 'DESC' },
        take: filter.limit,
        skip: filter.offset,
      });
      return reads.map((read) => ({
        ...read,
        timestamp: read.endDate,
        value: read.value,
      }));
    } catch (e) {
      this.logger.error(
        'exception caught in between device onboarding checking for createdAt',
      );
      this.logger.error(e);
    }
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
    const reads = measurements.reads.map((read) => ({
      externalId: id,
      startDate: read.startDate,
      endDate: read.endDate,
      value: convertToWh(read.value, measurements.unit),
      unit: Unit.Wh,
      type: measurements.type,
      certified: measurements.type === ReadType.Delta ? true : false,
    }));
    await this.repository.insert(reads);
  }

  public async findCumulativeValue(device: DeviceDTO) {
    const cumulativeValue = await this.repository
      .createQueryBuilder('read')
      .select('SUM(read.value)', 'totalValue')
      .addSelect('MAX(read.end_date)', 'maxEndDate')
      .where('read.external_id = :deviceId', { deviceId: device.externalId })
      .getRawOne();

    return {
      value: cumulativeValue.totalValue || 0,
      datetime: cumulativeValue.maxEndDate
        ? new Date(cumulativeValue.maxEndDate)
        : new Date(device.createdAt),
    };
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

  private getMultiplier(unit: Unit) {
    switch (unit) {
      case Unit.Wh:
        return 1;
      case Unit.kWh:
        return 10 ** 3;
      case Unit.MWh:
        return 10 ** 6;
      case Unit.GWh:
        return 10 ** 9;
      default:
        this.logger.warn(`Unknown unit: ${unit}, defaulting to Wh.`);
        return 1;
    }
  }

  private roundMeasurementsToUnit(
    measurement: NewIntermediateMeterReadDTO,
  ): NewIntermediateMeterReadDTO {
    const multiplier = this.getMultiplier(measurement.unit);

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
    const lastRead = await this.findLatestRead(deviceId);
    if (measurement.type === 'History') {
      return this.processHistoricalReads(device, measurement);
    } else if (measurement.type === 'Delta') {
      return this.processDeltaReads(device, measurement, lastRead);
    } else if (measurement.type === 'Aggregate') {
      return this.processAggregateReads(device, measurement);
    }
  }

  private async processHistoricalReads(
    device: DeviceDTO,
    measurement: NewIntermediateMeterReadDTO,
  ): Promise<MeasurementDTO> {
    const reads: ReadDTO[] = [];
    for (const element of measurement.reads) {
      await this.validateHistoricalReads(device, element, measurement.unit);

      const readStartDateTime = DateTime.fromISO(
        new Date(element.starttimestamp).toISOString(),
      );
      const readEndDateTime = DateTime.fromISO(
        new Date(element.endtimestamp).toISOString(),
      );
      const readTimePeriod = Math.abs(
        readStartDateTime.diff(readEndDateTime, ['hours']).toObject()?.hours ||
          0,
      );

      const read: ReadDTO = {
        startDate: new Date(element.starttimestamp),
        endDate: new Date(element.endtimestamp),
        value: element.value,
      };

      const historyValidation = await this.historyValidateEnergy(
        read,
        device,
        readTimePeriod,
        measurement,
        readStartDateTime.toJSDate(),
        readEndDateTime.toJSDate(),
      );

      if (historyValidation) {
        reads.push(read);
      } else {
        this.storeFailedReads(
          device.externalId,
          element.value,
          element.endtimestamp,
          measurement.unit,
        );
        throw new ConflictException({
          success: false,
          message: 'Failed,read value is greater than from MaxEnergy',
        });
      }
    }

    return {
      reads: reads,
      unit: measurement.unit,
      type: measurement.type,
    };
  }

  private async processDeltaReads(
    device: DeviceDTO,
    measurement: NewIntermediateMeterReadDTO,
    lastRead: ReadDTO | void,
  ): Promise<MeasurementDTO> {
    const reads: ReadDTO[] = [];
    if (!lastRead) {
      await new Promise((resolve, reject) => {
        measurement.reads.forEach(async (element, measurementReadIndex) => {
          if (lastRead && lastRead.endDate) {
            if (
              new Date(element.endtimestamp).getTime() <
              new Date(lastRead.endDate).getTime()
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
                  message: `The sent date for reading ${element.endtimestamp} is less than last sent meter read date ${lastRead.endDate}`,
                }),
              );
            }
          }

          reads.push({
            startDate: new Date(device.createdAt),
            endDate: new Date(element.endtimestamp),
            value: element.value,
          });
          if (measurementReadIndex == measurement.reads.length - 1) {
            resolve(true);
          }
        });
      });
      await this.deviceService.updateReadType(
        device.externalId,
        measurement.type,
      );
      return {
        reads: reads,
        unit: measurement.unit,
        type: measurement.type,
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
              endDate: ${lastRead.endDate}
              ${typeof lastRead.endDate}
              endDate: ${lastRead.endDate.toISOString()}
              ${typeof lastRead.endDate.toISOString()}`);
            if (lastRead && lastRead.endDate) {
              if (
                new Date(element.endtimestamp).getTime() <
                new Date(lastRead.endDate).getTime()
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
                    message: `The sent date for reading ${element.endtimestamp} is less than last sent meter read date ${lastRead.endDate.toISOString()}`,
                  }),
                );
              }
            }

            const read: ReadDTO = {
              startDate: lastRead.endDate,
              endDate: new Date(element.endtimestamp),
              value: element.value,
            };
            const deltaValidation = this.validateEnergy(read, device);
            if (deltaValidation.success) {
              reads.push(read);
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
          type: measurement.type,
        };
      }
    }
  }

  private async processAggregateReads(
    device: DeviceDTO,
    measurement: NewIntermediateMeterReadDTO,
  ) {
    const deviceId = device.externalId;
    const reads: any = [];
    const lastRead = await this.findLatestRead(deviceId);

    if (
      lastRead &&
      device?.meterReadtype != measurement.type &&
      device?.meterReadtype != null
    ) {
      throw new NotFoundException(
        `In this device you can add read for ${device?.meterReadtype} type but you are sending  ${measurement.type}`,
      );
    }
    await new Promise((resolve, reject) => {
      measurement.reads.forEach(async (element, measurementReadIndex) => {
        const lastValue = await this.findCumulativeValue(device);
        const delta = Math.abs(element.value - lastValue.value);
        if (
          new Date(element.endtimestamp).getTime() <
            new Date(lastValue.datetime).getTime() ||
          element.value <= lastValue.value
        ) {
          return reject(
            new ConflictException({
              success: false,
              message: `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent mter read date/value ${lastValue.datetime}/${lastValue.value} `,
            }),
          );
        }

        const read: ReadDTO = {
          startDate: new Date(lastValue.datetime),
          endDate: new Date(element.endtimestamp),
          value: delta,
        };
        const validation = this.validateEnergy(read, device);
        if (!validation.success) {
          return reject(
            new ConflictException({
              success: false,
              message: validation.message,
            }),
          );
        }
        reads.push({
          startDate: new Date(lastValue.datetime),
          endDate: new Date(element.endtimestamp),
          value: delta,
        });
        if (measurementReadIndex == measurement.reads.length - 1) {
          resolve(true);
        }
      });
    });

    if (device?.meterReadtype != measurement.type) {
      await this.deviceService.updateReadType(deviceId, measurement.type);
    }

    return {
      reads: reads,
      unit: measurement.unit,
      type: ReadType.Delta,
    };
  }

  async findLatestRead(meterId: string): Promise<ReadDTO | void> {
    return await this.repository.findOne({
      where: {
        externalId: meterId,
        type: In([ReadType.Delta, ReadType.Aggregate]),
      },
      order: {
        endDate: 'DESC',
      },
    });
  }

  @Profile()
  async findLastReadForMeterWithinRange(
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const read = await this.repository.findOne({
      where: {
        externalId: meterId,
        startDate,
        endDate,
        type: [ReadType.Delta],
      },
      order: {
        endDate: 'DESC',
      },
    });
    return [read];
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
  ): SelectQueryBuilder<MeterRead> {
    this.logger.verbose(startDate);
    this.logger.verbose(endDate);

    return this.repository
      .createQueryBuilder('read')
      .where('read.externalId = :deviceId', { deviceId })
      .andWhere('read.type = :type', {
        type: ReadType.History,
      })
      .andWhere('read.start_date >= :startDate', { startDate })
      .andWhere('read.end_date <= :endDate', { endDate });
  }

  private validateEnergy(
    read: ReadDTO,
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
    const startDate = DateTime.fromISO(read.startDate.toISOString());
    const endDate = DateTime.fromISO(read.endDate.toISOString());

    const meteredTimePeriod = Math.abs(
      endDate.diff(startDate, ['hours']).toObject()?.hours || 0,
    ); // hours
    const maxEnergy = computeMaxEnergyCapacity(
      capacity,
      meteredTimePeriod,
      deviceAge,
      yieldValue,
    );
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${DEVICE_DEGRADATION}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
    );
    if (read.value < maxEnergy) {
      return {
        success: true,
        message: 'Validation successful',
      };
    } else {
      return {
        success: false,
        message: `Failed, MaxEnergy: ${maxEnergy}`,
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
      yieldValue,
    );
    this.logger.debug(
      `capacity: ${capacity}, meteredTimePeriod: ${meteredTimePeriod}, deviceAge: ${deviceAge}, degradation: ${DEVICE_DEGRADATION}, yieldValue: ${yieldValue}`,
    );
    this.logger.debug(
      `${read.value < maxEnergy ? 'Passed' : 'Failed'}, MaxEnergy: ${maxEnergy}`,
    );

    if (read.value < maxEnergy) {
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
          const reservedEndDate = new Date(
            historyNextIssue.reservationEndDate,
          ).getTime();
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
      return read.value < maxEnergy;
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
      const startTime = DateTime.fromJSDate(measurement.startDate)
        .minus({ minutes: 30 })
        .toJSDate();
      const endTime = DateTime.fromJSDate(measurement.endDate).toJSDate();

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

  public async getCheckHistoryCertificateIssueDateLogForDevice(
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MeterRead[]> {
    const query = this.getHistoryDeviceLogFilteredQuery(
      deviceId,
      startDate,
      endDate,
    );

    try {
      const { entities } = await query.getRawAndEntities();
      return entities;
    } catch (error) {
      this.logger.error(`Failed to retrieve device`, error.stack);
    }
  }

  private getHistoryDeviceLogFilteredQuery(
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<MeterRead> {
    return this.repository
      .createQueryBuilder('read')
      .where('read.externalId = :deviceId', { deviceId })
      .where('read.type = :type', {
        type: ReadType.History,
      })
      .andWhere('read.startDate >= :startDate', { startDate })
      .andWhere('read.endDate <= :endDate', { endDate })
      .andWhere('read.certified != true');
  }

  async getDeviceHistoryCertificateIssueDate(
    conditions: FindConditions<MeterRead>,
  ): Promise<MeterRead | null> {
    return (
      (await this.repository.findOne({
        ...conditions,
        type: ReadType.History,
      })) ?? null
    );
  }

  async updateHistoryCertificateIssueDate(
    id: number,
    startDate: Date,
    endDate: Date,
  ): Promise<MeterRead> {
    const historyDevice = await this.getDeviceHistoryCertificateIssueDate({
      id: id,
    });
    let updatedHistoryIssue = new MeterRead();
    if (historyDevice) {
      historyDevice.type = ReadType.History;
      historyDevice.startDate = startDate;
      historyDevice.endDate = endDate;
      historyDevice.certified = true;
      historyDevice.issuanceStartDate = startDate;
      historyDevice.issuanceEndDate = endDate;
      updatedHistoryIssue = await this.repository.save(historyDevice);
    }
    return updatedHistoryIssue;
  }

  @Profile()
  async getAggregateMeterReadsFirstEntryOfDevice(
    meterId: string,
  ): Promise<ReadDTO[]> {
    return this.repository.find({
      where: {
        externalId: meterId,
        type: ReadType.Aggregate,
      },
      take: 1,
    });
  }

  // add new function for Delta firstread filter
  @Profile()
  async getDeltaMeterReadsFirstEntryOfDevice(
    meterId: string,
  ): Promise<ReadDTO[]> {
    return this.repository.find({
      where: {
        externalId: meterId,
        type: ReadType.Delta,
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
    const startDate = filter.start ? new Date(filter.start) : deviceOnboarded;
    const endDate = filter.end ? new Date(filter.end) : new Date();

    const sizeOfPage = 15;

    const currentPage = !isNaN(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const offset = (currentPage - 1) * sizeOfPage;

    const query = this.repository
      .createQueryBuilder('read')
      .where('read.externalId = :deviceId', { deviceId: externalId })
      .andWhere('read.start_date <= :endDate', { endDate })
      .andWhere('read.end_date >= :startDate', { startDate })
      .orderBy('read.start_date', 'ASC')
      .skip(offset)
      .take(sizeOfPage);

    const [reads, total] = await query.getManyAndCount();

    return {
      historyread: reads.filter((read) => read.type === ReadType.History),
      ongoing: reads.filter((read) => read.type !== ReadType.History),
      numberOfReads: reads.length,
      numberOfPages: total,
      currentPageNumber: currentPage,
    };
  }

  async latestRead(deviceExternalId: string): Promise<any> {
    return this.repository
      .createQueryBuilder('reads')
      .where('reads.external_id = :deviceExternalId', { deviceExternalId })
      .orderBy('reads.end_date', 'DESC')
      .getOne();
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

    const monthlyQuery = `SELECT time, SUM ("read") AS total_meter_reads
                          FROM "read"
                          WHERE time >= '${startDate}' AND time < '${endDate}' AND meter = '${meter}'
                          GROUP BY time (1d, ${formattedOffSet})`;
    const yearlyQuery = `SELECT time, SUM ("read") AS total_meter_reads
                         FROM "read"
                         WHERE time >= '${startDate}' AND time < '${endDate}' AND meter = '${meter}'
                         GROUP BY time (30d, ${formattedOffSet})`;
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
    const data = await this.retrieveDataWithLastValue(meter, filter);
    this.logger.verbose(`data: ${data}`);
    return data;
  }

  async retrieveDataWithLastValue(
    meter: string,
    filter: FilterDTO,
  ): Promise<any[]> {
    const query = this.repository
      .createQueryBuilder('read')
      .where('read.externalId = :externalId', { externalId: meter })
      .andWhere('read.type IN (:...types)', {
        types: [ReadType.Delta, ReadType.Aggregate],
      });

    if (filter.end) {
      const newStartDate = new Date(new Date(filter.end).getTime() + 1000);
      query.andWhere('read.start_date <= :startDate', {
        startDate: newStartDate,
      });
    } else if (filter.start) {
      query.andWhere('read.start_date >= :startDate', {
        startDate: new Date(filter.start),
      });
    }

    if (filter.end) {
      query.andWhere('read.end_date <= :endDate', {
        endDate: new Date(filter.end),
      });
    }

    const results = await query.getMany();

    return results.map((read) => ({
      startDate: read.startDate,
      endDate: read.endDate,
      value: read.value,
      type: read.type,
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
      measurements.type === ReadType.Aggregate
    ) {
      let datesContainingNullOrEmptyValues = false;
      let dateValid1 = true;
      let allDatesAreAfterCreatedAt = true;
      let allDatesAreAfterCommissioningDate = true;
      let allEndDatesAreBeforeSystemDate = true;
      let endDate: any;
      let currentDate: Date = new Date();
      measurements.reads.forEach((ele) => {
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

    if (device && device.organizationId != organizationId) {
      this.logger.error(
        `Device doesn't belongs to the requested users organization`,
      );
      throw new ConflictException({
        success: false,
        message: `Device doesn't belongs to the requested users organization`,
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

  async getAllByExternalId(externalId: string): Promise<ReadDTO[]> {
    this.logger.verbose('Within get');
    const reads = await this.repository.find({
      where: {
        external_id: externalId,
      },
    });
    return reads;
  }

  async countOngoingReadsSinceDeviceOnboardingDate(
    externalId: string,
    onboardedDate: Date,
  ): Promise<number> {
    this.logger.verbose(`With in getNumberOfOngReadsBoarded`);
    return await this.repository.count({
      where: {
        externalId: externalId,
        type: In([ReadType.Delta, ReadType.Aggregate]),
        startDate: MoreThanOrEqual(onboardedDate),
      },
    });
  }

  private async validateHistoricalReads(
    device: DeviceDTO,
    element: any,
    unit: Unit,
  ) {
    const checkHistoryReading = await this.checkHistoryReadExist(
      device.externalId,
      element.starttimestamp,
      element.endtimestamp,
    );

    if (checkHistoryReading) {
      this.storeFailedReads(
        device.externalId,
        element.value,
        element.endtimestamp,
        unit,
      );
      throw new ConflictException({
        success: false,
        message: `There are already one or more historical entries for this device which are conflicting current reading start date and/or end date `,
      });
    }

    const historyAge = new Date(device.createdAt);
    historyAge.setFullYear(historyAge.getFullYear() - 3);

    const requestStartDate = DateTime.fromISO(
      new Date(element.starttimestamp).toISOString(),
    );
    const requestCurrentEnd = DateTime.fromISO(
      new Date(element.endtimestamp).toISOString(),
    );

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
        unit,
      );
      throw new ConflictException({
        success: false,
        message: `For History Type Reads of devices start time and/or end time should be within 3 year of device onboarding, ex: device onboarded date: ${device?.createdAt}maximum date allowed for start and end date should be within 3 year in past from onboarded date, ${device?.createdAt}`,
      });
    }
  }
}
