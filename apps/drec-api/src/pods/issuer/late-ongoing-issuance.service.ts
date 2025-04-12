import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ReadsService as BaseReadsService } from '@energyweb/energy-api-influxdb';
import { IIssueCommandParams } from '@energyweb/origin-247-certificate';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { ICertificateMetadata } from '../../utils/types';

import { Queues } from '../../../src/utils/enums/queues.enum';
import { splitValueIntoIntegerAndDecimal } from '../../lib/helpers/splitValueIntoIntegerAndDecimal';
import { IDevice } from '../../models';
import {
  CertificateType,
  ReadType,
  StandardCompliance,
} from '../../utils/enums';
import { CertificateLogService } from '../certificate-log/certificate-log.service';
import { Device } from '../device';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { DeviceService } from '../device/device.service';
import { DeviceLateOngoingIssueCertificateEntity } from '../device/device_lateongoing_certificate.entity';
import { OrganizationService } from '../organization/organization.service';
import { BASE_READ_SERVICE } from '../reads/constants';
import { ReadsService } from '../reads/reads.service';
import { CertificateService } from './certificate.service';

type DeviceReading = {
  timestamp: Date;
  value: number;
};

@Injectable()
export class LateOngoingIssuanceService {
  private readonly logger = new Logger(LateOngoingIssuanceService.name);

  constructor(
    @InjectQueue(Queues.LateOngoingIssuance)
    private readonly lateOngoingQueue: Queue,
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private certificateLogService: CertificateLogService,
    private readService: ReadsService,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
    private certificateService: CertificateService,
  ) {}

  @Cron('0 0 */8 * * *')
  async scheduleIssuance(): Promise<void> {
    try {
      const activeDeviceGroups =
        await this.groupService.getAllReservationActive();

      if (!activeDeviceGroups.length) {
        this.logger.debug('No active device groups found.');
        return;
      }

      for (const group of activeDeviceGroups) {
        await this.lateOngoingQueue.add({ groupId: group.id });
      }

      this.logger.debug(
        `Queued ${activeDeviceGroups} jobs for late ongoing issuance.`,
      );
    } catch (error) {
      this.logger.error('Error scheduling late ongoing issuance', error.stack);
    }
  }

  /**
   * Processes certificate issuance for late ongoing cycles
   *
   * @param groupId - Optional group ID to filter cycles
   * @returns Promise that resolves when processing completes
   */
  async processIssuance(groupId?: number): Promise<void> {
    this.logger.debug('Starting late ongoing issuance processing');

    // Fetch all late cycles that need processing
    const cycles = await this.deviceService.findAllLateCycle(groupId);

    if (!cycles?.length) {
      this.logger.error('No late ongoing read cycles found');
      return;
    }

    this.logger.debug(`Found ${cycles.length} cycles to process`);

    // Process each cycle sequentially
    for (let index = 0; index < cycles.length; index++) {
      const cycle = cycles[index];
      this.logger.debug(
        `Processing cycle ${index + 1} of ${cycles.length} for device: ${cycle.device_externalid}`,
      );

      // Fetch group and device data in parallel
      const [group, device] = await Promise.all([
        this.groupService.findOne({ id: cycle.groupId }),
        this.deviceService.findReads(cycle.device_externalid),
      ]);

      // Handle missing group
      if (!group) {
        this.logger.error(
          `Group missing for cycle ID: ${cycle.id}, device: ${cycle.device_externalid}`,
        );
        await this.deviceService.archiveLateOngoing(cycle.id);
        continue;
      }

      // Check organization and expiration status
      const organization = await this.organizationService.findOne(
        group.organizationId,
      );

      if (group.isExpired() || !organization) {
        this.logger.error(`Reservation expired for group ID: ${group.id}`);
        await this.deviceService.archiveLateOngoingIfReservationInactive(
          group.id,
        );
        continue;
      }

      // Fetch last read and next issuance data in parallel
      const [lastRead, nextIssuance] = await Promise.all([
        this.readService.latestRead(device.externalId, device.createdAt),
        this.groupService.getGroupCertificateIssueDate({ groupId: group.id }),
      ]);

      // Handle missing read data
      if (!lastRead.length) {
        this.logger.error(`No readings found for device: ${device.externalId}`);
        continue;
      }

      // Prepare group and device data for issuance
      group.loadLeftOverReadsByCountry();
      group.devices = [device];

      // Update next issuance dates if available
      if (nextIssuance) {
        nextIssuance.start_date = cycle.late_start_date;
        nextIssuance.end_date = cycle.late_end_date;
      }

      // Process based on last read timestamp
      const lastReadDate = new Date(lastRead[0].timestamp);
      const isReadInTimeRange =
        lastReadDate.getTime() <= cycle.lateEndTimestamp &&
        lastReadDate.getTime() >= cycle.lateStartTimestamp;

      if (isReadInTimeRange) {
        return this.issueForInRangeLastRead(
          cycle,
          device,
          group,
          lastReadDate,
          nextIssuance,
        );
      }

      // Handle case where read is outside the time range
      this.logger.verbose('Processing read outside target time range');
      await this.issueForRecentLastRead(cycle, device, group, nextIssuance);
    }
  }

  private async issueForInRangeLastRead(
    cycle: DeviceLateOngoingIssueCertificateEntity,
    device: Device,
    group: DeviceGroup,
    lastReadDate: Date,
    nextIssuance: DeviceGroupNextIssueCertificate,
  ) {
    this.logger.verbose(
      'If Last read less from late end_date and greater then from latest_date',
    );

    const certifiedDevices =
      await this.deviceService.getCheckCertificateIssueDateLogForDevice(
        cycle.device_externalid,
        cycle.lateStartDate,
        lastReadDate,
      );

    const newStartDate = lastReadDate;
    newStartDate.setTime(newStartDate.getTime() + 1); // Add one millisecond

    if (
      certifiedDevices.length > 0 ||
      newStartDate.getTime() === cycle.lateStartTimestamp
    )
      return;

    await this.deviceService.updateLateOngoing(
      device.externalId,
      cycle.id,
      lastReadDate.toISOString(),
    );

    const isLateOngoingCycle =
      await this.deviceService.findDeviceLateCycleOfDateRange(
        group.id,
        device.externalId,
        DateTime.fromJSDate(lastReadDate).toUTC(),
        cycle.lateEndDateUTC,
      );

    if (!isLateOngoingCycle) {
      await this.addCycle(
        group.id,
        device.externalId,
        newStartDate.toISOString(),
        cycle.lateEndDate.toISOString(),
      );
    }
    this.logger.debug(
      'Late ongoing Issue Certificate For::',
      cycle.device_externalid,
    );
    await this.issueCertificateForGroup(
      group,
      cycle.lateStartDateUTC,
      DateTime.fromJSDate(lastReadDate).toUTC(),
      device.countryCode,
      nextIssuance,
    );
  }

  private async issueForRecentLastRead(
    cycle: DeviceLateOngoingIssueCertificateEntity,
    device: Device,
    group: DeviceGroup,
    nextIssuance: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    this.logger.verbose('dLast read greater then from late_end_date');

    const allReadsForDeviceBetweenTimeRange = await this.baseReadsService.find(
      device.externalId,
      {
        offset: 0,
        limit: 5000,
        start: cycle.lateStartDateUTC.toString(),
        end: cycle.lateEndDateUTC.toString(),
      },
    );

    this.logger.debug(
      'Device Reads For:: ' + cycle.device_externalid,
      'From: ' + cycle.lateStartDateUTC.toString(),
      'To: ' + cycle.lateEndDateUTC.toString(),
      'Equal to ' + allReadsForDeviceBetweenTimeRange?.length,
    );
    if (!allReadsForDeviceBetweenTimeRange?.length) {
      return;
    }
    await this.deviceService.updateLateOngoing(
      device.externalId,
      cycle.id,
      cycle.late_end_date,
    );

    await this.issueCertificateForGroup(
      group,
      cycle.lateStartDateUTC,
      cycle.lateEndDateUTC,
      device.countryCode,
      nextIssuance,
    );
  }

  private async issueCertificateForGroup(
    group: DeviceGroup,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string,
    groupRequest?: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    this.logger.verbose(
      `Processing certificate issuance for group: ${group.id}`,
    );

    // Skip if buyer information is missing
    if (!group.buyerAddress || !group.buyerId) {
      return;
    }

    // Retrieve device readings for the time period
    const deviceId = group.devices[0].externalId;
    const allReadsForDeviceBetweenTimeRange = await this.baseReadsService.find(
      deviceId,
      {
        offset: 0,
        limit: 5000,
        start: startDate.toString(),
        end: endDate.toString(),
      },
    );

    // Filter out readings that have already been certified
    const { totalReadValue, filteredReadings } =
      (await this.filterOutCertifiedReads(
        group,
        startDate,
        endDate,
        allReadsForDeviceBetweenTimeRange,
      )) || { totalReadValue: 0, filteredReadings: [] };

    // Skip if no valid readings
    if (totalReadValue === 0) {
      this.logger.debug(
        `No valid uncertified readings found for group: ${group.id}`,
      );
      return;
    }

    // Generate unique transaction ID
    const certificateTransactionUID = uuid();

    // Get previous readings for time context
    const previousReadings = await this.getPreviousReading(
      group.devices[0],
      filteredReadings,
    );

    // Process leftover readings and convert to kilowatts
    const totalReadValueKw = await this.handleLeftoverReadsByCountryCode(
      group,
      totalReadValue,
      countryCodeKey,
    );

    // Skip if no whole kilowatt hours to certify
    if (!totalReadValueKw) {
      this.logger.debug(
        `No whole kilowatt hours to certify for group: ${group.id}`,
      );
      return;
    }

    // Convert back to watts for certificate issuance
    const issueTotalReadValue = totalReadValueKw * 1000;

    // Determine precise timestamp boundaries
    const minimumStartDate =
      previousReadings.length > 0
        ? new Date(previousReadings[0].timestamp.getTime() + 1000)
        : new Date(startDate.toString());

    const maximumEndDate =
      allReadsForDeviceBetweenTimeRange[
        allReadsForDeviceBetweenTimeRange.length - 1
      ].timestamp;

    // Log the certificate details
    this.certificateLogService.createDeviceCertificateLog(
      group,
      minimumStartDate,
      maximumEndDate,
      startDate,
      endDate,
      issueTotalReadValue,
      certificateTransactionUID,
    );

    // Prepare certificate issuance parameters
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(),
      energyValue: issueTotalReadValue.toString(),
      fromTime: minimumStartDate,
      toTime: maximumEndDate,
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,
      metadata: {
        version: 'v1.0',
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: group.devices.map((device: IDevice) => device.externalId),
        groupId: group.id?.toString() || null,
        certificateTransactionUID: certificateTransactionUID.toString(),
      },
    };

    // Calculate and update megawatt hour values
    const totalReadValueMegaWattHour = totalReadValueKw / 1000;
    await this.groupService.updateTotalReadingRequestedForCertificateIssuance(
      group.id,
      group.organizationId,
      totalReadValueMegaWattHour,
    );

    // Check if target volume reached and end reservation if needed
    const newTotalRequested =
      group.targetVolumeCertificateGenerationRequestedInMegaWattHour +
      totalReadValueMegaWattHour;

    if (
      group.reservationActive &&
      !group.authorityToExceed &&
      newTotalRequested >= group.targetVolumeInMegaWattHour
    ) {
      await this.groupService.endReservation(group.id, group, groupRequest);
    }

    // Create group certificate log
    await this.certificateLogService.createGroupCertificateLog(
      group,
      minimumStartDate,
      maximumEndDate,
      issueTotalReadValue,
      issuance,
      countryCodeKey,
      certificateTransactionUID,
    );

    // Issue the certificate
    return this.certificateService.issue(issuance);
  }

  private async filterOutCertifiedReads(
    group: DeviceGroup,
    startDate: DateTime,
    endDate: DateTime,
    deviceReadings: DeviceReading[],
  ) {
    if (!deviceReadings || !deviceReadings?.length) return;

    let filteredReadings = [...deviceReadings];

    if (group?.devices[0].meterReadtype === 'Delta') {
      const firstDeltaRead =
        await this.readService.getDeltaMeterReadsFirstEntryOfDevice(
          group?.devices[0].externalId,
        );

      // Optimize by extracting timestamps to a Set for O(1) lookups
      const deltaReadTimestamps = new Set(
        firstDeltaRead.map((entry) => entry.readsEndDate.getTime()),
      );

      filteredReadings = filteredReadings.filter(
        (reading) => !deltaReadTimestamps.has(reading.timestamp.getTime()),
      );
    }

    const certifiedDevices =
      await this.deviceService.getCheckCertificateIssueDateLogForDevice(
        group.devices[0].externalId,
        new Date(startDate.toString()),
        new Date(endDate.toString()),
      );

    if (certifiedDevices.length > 0) {
      const certifiedRanges = certifiedDevices.map((cert) => ({
        startTime: new Date(cert.certificate_issuance_startdate).getTime(),
        endTime: new Date(cert.certificate_issuance_enddate).getTime(),
      }));

      filteredReadings = filteredReadings.filter((reading) => {
        const readingTime = reading.timestamp.getTime();
        // Check if this reading falls within any certified range
        return !certifiedRanges.some(
          (range) =>
            readingTime >= range.startTime && readingTime <= range.endTime,
        );
      });
    }

    const totalReadValue = filteredReadings.reduce(
      (sum, reading) => sum + reading.value,
      0,
    );

    return {
      totalReadValue,
      filteredReadings,
    };
  }

  private async getPreviousReading(
    device: Device,
    deviceReadings: DeviceReading[],
  ): Promise<DeviceReading[]> {
    if (!deviceReadings.length) {
      return [];
    }
    // Extract device information once to avoid repeated access
    const { externalId, createdAt, meterReadtype } = device;

    // Calculate the time range for finding previous readings
    const endTimestampToCheck = new Date(
      deviceReadings[0].timestamp.getTime() - 1,
    );

    try {
      // Find the last reading within the specified range
      const previousReadings =
        await this.readService.findLastReadForMeterWithinRange(
          externalId,
          new Date(createdAt),
          endTimestampToCheck,
        );

      // Return the readings if found
      if (previousReadings.length > 0) {
        return previousReadings;
      }

      // Handle different meter types if no readings were found
      switch (meterReadtype) {
        case ReadType.Delta:
          // For Delta meters, use device creation date with zero value
          return [{ timestamp: new Date(createdAt), value: 0 }];

        case ReadType.ReadMeter:
          // For ReadMeter type, try to get first entry from aggregate readings
          try {
            const aggregateReadings =
              await this.readService.getAggregateMeterReadsFirstEntryOfDevice(
                externalId,
              );

            if (aggregateReadings.length > 0) {
              return [
                {
                  timestamp: new Date(aggregateReadings[0].datetime),
                  value: 0,
                },
              ];
            }
          } catch (error) {
            this.logger.error(
              `Error retrieving aggregate readings for device ${externalId}: ${error}`,
            );
          }
          break;
      }

      // Return empty array as fallback
      return [];
    } catch (error) {
      this.logger.error(
        `Error retrieving previous readings for device ${externalId}: ${error}`,
      );
      return [];
    }
  }

  /**
   * Adds a new late ongoing certificate issuance cycle for a device
   *
   * @param groupId - The ID of the device group
   * @param deviceExternalId - The external ID of the device
   * @param lateStartDate - The start date for the late issuance cycle
   * @param lateEndDate - The end date for the late issuance cycle
   * @returns Promise resolving to the created certificate cycle entity
   */
  public async addCycle(
    groupId: number,
    deviceExternalId: string,
    lateStartDate: Date | string | DateTime,
    lateEndDate: Date | string | DateTime,
  ): Promise<DeviceLateOngoingIssueCertificateEntity> {
    this.logger.debug(
      `Creating late cycle for device: ${deviceExternalId}, group: ${groupId}`,
    );

    // Create and populate the entity
    const cycleEntity = new DeviceLateOngoingIssueCertificateEntity();
    cycleEntity.device_externalid = deviceExternalId;
    cycleEntity.groupId = groupId;
    cycleEntity.late_start_date = lateStartDate.toString();
    cycleEntity.late_end_date = lateEndDate.toString();

    // Persist the entity
    const savedEntity =
      await this.deviceService.addLateCertificateIssueDateLogForDevice(
        cycleEntity,
      );

    this.logger.debug(
      `Created late cycle ID: ${savedEntity.id} for device: ${deviceExternalId}`,
    );
    return savedEntity;
  }

  public async handleLeftoverReadsByCountryCode(
    group: DeviceGroup,
    totalReadValueW: number,
    countryCodeKey: string,
  ): Promise<number> {
    const WATTS_TO_KW_CONVERSION = 1000; // 10^3

    // 1. Convert watts to kilowatts and add any existing leftover value
    const leftovers = group.leftoverReadsByCountryCode?.[countryCodeKey] || 0;
    const totalReadValueKw =
      totalReadValueW / WATTS_TO_KW_CONVERSION + leftovers;

    // 2. Split the value into integer and decimal components
    const { integralVal, decimalVal } =
      splitValueIntoIntegerAndDecimal(totalReadValueKw);

    // 3. Store the decimal component for future accumulation
    await this.groupService.updateLeftOverReadByCountryCode(
      group.id,
      decimalVal,
      countryCodeKey,
    );

    // 4. Return the integer component for certificate issuance
    return integralVal;
  }
}
