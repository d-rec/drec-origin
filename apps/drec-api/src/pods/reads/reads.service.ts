import { InjectQueue } from '@nestjs/bull';
import {
  ConflictException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { BigNumber } from 'ethers';
import { DateTime } from 'luxon';
import * as momentTimeZone from 'moment-timezone';
import {
  Between,
  Brackets,
  FindConditions,
  In,
  MoreThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { DEFAULT_YIELD_VALUE, DEVICE_DEGRADATION } from '../../constants';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import { computeMaxEnergyCapacity } from '../../lib/meter-read';
import { Profile } from '../../lib/profile';
import {
  toTimezoneDate,
  toTimezoneDateFormat,
} from '../../transformers/timezone';
import {
  MeasurementDTO,
  ReadDTO,
  ReadsFilterDTO,
  Unit,
} from '../../types/reads';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { convertToWh } from '../../utils/convert-to-power-units';
import { ReadType } from '../../utils/enums';
import { HistoryNextIssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { Queues } from '../../utils/enums/queues.enum';
import { validateTimezone } from '../../validations/timezone';
import { BulkUploadType } from '../bulk-upload/bulk-uploads.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceService } from '../device/device.service';
import { DeviceDTO } from '../device/dto';
import { OrganizationService } from '../organization/organization.service';
import { FilterNoOffLimit } from './dto/filter-no-off-limit.dto';
import { NewIntermediateMeterReadDTO } from './dto/intermediate_meter_read.dto';
import { FailedMeterRead } from './failed-reads.entity';
import { MeterRead } from './reads.entity';

@Injectable()
export class ReadsService {
  public readonly logger = new Logger(ReadsService.name);

  constructor(
    @InjectRepository(MeterRead)
    private readonly repository: Repository<MeterRead>,
    @InjectRepository(FailedMeterRead)
    private readonly failedReadsRepository: Repository<FailedMeterRead>,
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
    filter: ReadsFilterDTO,
  ): Promise<Array<MeterRead>> {
    try {
      const where: FindConditions<MeterRead> = {
        externalId: meterId,
        endDate: Between(new Date(filter.start), new Date(filter.end)),
        type: ReadType.Delta,
      };

      if (filter.certified != undefined && filter.certified != null) {
        where.certified = filter.certified;
      }

      return await this.repository.find({
        where,
        order: {
          endDate: filter.order || 'ASC',
        },
        take: filter.limit,
        skip: filter.offset,
      });
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
    startDate: Date,
    endDate: Date,
    unit: Unit,
    type: ReadType,
  ): Promise<void> {
    const readInWh = convertToWh(read, unit);
    this.failedReadsRepository.insert({
      externalId: meterId,
      startDate: startDate,
      endDate: endDate,
      value: readInWh,
      unit: unit,
      type: type,
    });
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

  async store(id: string, measurements: MeasurementDTO): Promise<void> {
    const reads = measurements.reads.map((read) => ({
      externalId: id,
      startDate: read.startDate,
      endDate: read.endDate,
      value: convertToWh(read.value, measurements.unit),
      unit: Unit.Wh,
      type: measurements.type,
      certified: false,
    }));
    await this.repository.insert(reads);
  }

  public async findCumulativeValue(
    device: DeviceDTO,
  ): Promise<{ value: number; datetime: Date }> {
    const cumulativeValue = await this.repository
      .createQueryBuilder('read')
      .select('SUM(read.value)', 'totalValue')
      .addSelect('MAX(read.end_date)', 'maxEndDate')
      .where('read.external_id = :deviceId', { deviceId: device.externalId })
      .andWhere('read.type = :type', {
        type: ReadType.Delta,
      })
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
    switch (measurement.type) {
      case ReadType.History:
        return this.processHistoricalReads(device, measurement);
      case ReadType.Delta:
        return this.processDeltaReads(device, measurement, lastRead);
      case ReadType.Aggregate:
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
          element.starttimestamp,
          element.endtimestamp,
          measurement.unit,
          ReadType.History,
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
                lastRead.endDate,
                element.endtimestamp,
                measurement.unit,
                ReadType.Delta,
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
                  lastRead.endDate,
                  element.endtimestamp,
                  measurement.unit,
                  ReadType.Delta,
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
    const cumulativeValue = await this.findCumulativeValue(device);

    await new Promise((resolve, reject) => {
      measurement.reads.forEach(async (element, measurementReadIndex) => {
        const delta = Math.abs(element.value - cumulativeValue.value);

        if (
          new Date(element.endtimestamp).getTime() <
            new Date(cumulativeValue.datetime).getTime() ||
          element.value <= cumulativeValue.value
        ) {
          return reject(
            new ConflictException({
              success: false,
              message: `The sent date/value for reading ${element.endtimestamp}/${element.value} is less than last sent meter read date/value ${cumulativeValue.datetime}/${cumulativeValue.value} `,
            }),
          );
        }

        const read: ReadDTO = {
          startDate: new Date(cumulativeValue.datetime),
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
          startDate: new Date(cumulativeValue.datetime),
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
        type: ReadType.Delta,
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
  ): Promise<Array<MeterRead>> {
    return await this.find(meterId, {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      offset: 0,
      limit: 1,
      order: 'DESC',
    });
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
      .andWhere(
        new Brackets((qb) => {
          qb.where('read.startDate BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
          }).orWhere('read.endDate BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
          });
        }),
      );
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
            this.deviceGroupService.updateHistoryCertificateIssueStatus(
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
      .andWhere('read.type = :type', {
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

  async updateCertificateIssueDate(
    ids: number[],
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    await this.repository.update(
      { id: In(ids) },
      {
        certified: true,
        issuanceStartDate: startDate,
        issuanceEndDate: endDate,
      },
    );
  }

  @Profile()
  async getAggregateMeterReadsFirstEntryOfDevice(
    meterId: string,
  ): Promise<ReadDTO[]> {
    return this.repository.find({
      where: {
        externalId: meterId,
        type: ReadType.Delta,
      },
      order: {
        startDate: 'ASC',
      },
      take: 1,
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

    const currentPage =
      !isNaN(pageNumber) && pageNumber > 0 ? Number(pageNumber) : 1;
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
      numberOfReads: total,
      numberOfPages: Math.round(total / sizeOfPage),
      currentPageNumber: currentPage,
    };
  }

  async latestRead(deviceExternalId: string): Promise<any> {
    return this.repository.find({
      where: {
        externalId: deviceExternalId,
        type: ReadType.Delta,
      },
      order: {
        endDate: 'DESC',
      },
      take: 1,
    });
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
      await this.deviceService.findDeviceByExternalId(
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

  async countByType(deviceId: string, type: ReadType): Promise<number> {
    this.logger.verbose('Within countByType');
    return await this.repository.count({
      where: {
        type: type,
        externalId: deviceId,
      },
    });
  }

  async countOngoingReadsSinceDeviceOnboardingDate(
    externalId: string,
    onboardedDate: Date,
  ): Promise<number> {
    this.logger.verbose(`With in getNumberOfOngReadsBoarded`);
    return await this.repository.count({
      where: {
        externalId: externalId,
        type: ReadType.Delta,
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
        element.starttimestamp,
        element.endtimestamp,
        unit,
        ReadType.History,
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
        element.starttimestamp,
        element.endtimestamp,
        unit,
        ReadType.History,
      );
      throw new ConflictException({
        success: false,
        message: `For History Type Reads of devices start time and/or end time should be within 3 year of device onboarding, ex: device onboarded date: ${device?.createdAt}maximum date allowed for start and end date should be within 3 year in past from onboarded date, ${device?.createdAt}`,
      });
    }
  }
}
