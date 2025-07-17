import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

import { Profile } from '../../../lib/profile';
import { IDevice } from '../../../models';
import { CertificateLogService } from '../../certificate-log/certificate-log.service';
import { Device } from '../../device';
import { DeviceGroup } from '../../device-group/device-group.entity';
import { DeviceGroupService } from '../../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../../device-group/device_group_issuecertificate.entity';
import { DeviceService } from '../../device/device.service';
import { OrganizationService } from '../../organization/organization.service';
import { ReadsService } from '../../reads/reads.service';
import { CertificateService } from './certificate.service';

type DeviceReading = {
  timestamp: Date;
  value: number;
};

@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    private readonly groupService: DeviceGroupService,
    private readonly deviceService: DeviceService,
    private readonly organizationService: OrganizationService,
    private readonly readsService: ReadsService,
    private readonly certificateLogService: CertificateLogService,
    private readonly certificateService: CertificateService,
  ) {}

  /**
   * Issues certificates for a device group based on reads within a time period
   *
   * @param group - Device group data
   * @param groupRequest - Certificate issuance request
   * @param startDate - Start date for the issuance period
   * @param endDate - End date for the issuance period
   * @param countryCodeKey - Country code for the issuance
   */
  @Profile()
  public async issueCertificate(
    group: DeviceGroup,
    groupRequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string,
  ): Promise<void> {
    // Early validation checks - combine all checks at the beginning
    if (!group?.devices?.length || !group.buyerAddress || !group.buyerId) {
      this.logger.debug(
        'Skipping issuance: missing devices or buyer information',
      );
      return;
    }

    this.logger.verbose('Processing certificate issuance for group');

    // Fetch organization data
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      this.logger.error(
        `No organization found with code ${group.organizationId}`,
      );
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }

    // Process group device readings
    const { validDevices, totalReading, validReadings } =
      await this.processGroupDeviceReads(group, startDate, endDate);

    if (!totalReading || !validDevices.length) {
      return;
    }

    const totalReadValueKw =
      await this.groupService.processLeftOverReadsByCountryCode(
        group,
        totalReading,
        countryCodeKey,
      );

    if (!totalReadValueKw) {
      return;
    }

    // Issue certificate in watts
    const issueTotalReadValue = totalReadValueKw * 10 ** 3;

    const certificateTransactionUID = uuid();

    const minimumStartDate = startDate.toJSDate();
    const maximumEndDate = endDate.toJSDate();

    // Log the certificate details
    await Promise.all(
      validReadings.map(({ device, totalRead }) =>
        this.certificateLogService.createForDevice(
          group,
          device,
          minimumStartDate,
          maximumEndDate,
          totalRead,
          certificateTransactionUID,
          startDate,
          endDate,
        ),
      ),
    );

    // Prepare certificate issuance parameters
    const issuance = this.certificateService.getIssuanceParams(
      group,
      group.devices,
      issueTotalReadValue,
      minimumStartDate,
      maximumEndDate,
      certificateTransactionUID,
    );

    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );

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
    await this.certificateLogService.createForGroup(
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

  @Profile()
  private async processGroupDeviceReads(
    group: DeviceGroup,
    startDate: DateTime,
    endDate: DateTime,
  ) {
    const readings = await Promise.all(
      group.devices.map((device) =>
        this.getDeviceReads(device, startDate, endDate),
      ),
    );

    const validReadings = readings.filter(
      (reading) => reading.totalRead !== 0 && reading.device,
    );

    const validDevices = validReadings.map((reading) => reading.device);

    const totalReading = readings.reduce(
      (acc, reading) => acc + reading.totalRead,
      0,
    );

    const completeReads = readings.map((reading) => reading.completeReads);

    return {
      validDevices,
      validReadings,
      totalReading,
      completeReads,
    };
  }

  /**
   * Processes device readings and creates cycles for periods with missing data
   *
   * @param device - The device to process readings for
   * @param startDate - Start date of the reading period
   * @param endDate - End date of the reading period
   * @returns The device readings information
   */
  private async getDeviceReads(
    device: IDevice,
    startDate: DateTime,
    endDate: DateTime,
  ) {
    // Get device readings for the specified period
    const readings = await this.getDeviceReading(device, startDate, endDate);

    return {
      device,
      ...readings,
    };
  }

  /**
   * Filters out certified and invalid device readings
   *
   * @param group - The device group containing devices
   * @param startDate - Certificate period start date
   * @param endDate - Certificate period end date
   * @param deviceReadings - Array of device readings to filter
   * @returns Promise resolving to filtered readings and total value, or null if no valid readings
   */
  @Profile()
  private async filterOutCertifiedReads(
    device: Device | IDevice,
    startDate: DateTime,
    endDate: DateTime,
    deviceReadings: DeviceReading[],
  ): Promise<{ totalReadValue: number; filteredReadings: DeviceReading[] }> {
    if (!deviceReadings || !deviceReadings?.length)
      return { totalReadValue: 0, filteredReadings: [] };

    let filteredReadings = [...deviceReadings];

    if (device.meterReadtype === 'Delta') {
      const firstDeltaRead =
        await this.readsService.getDeltaMeterReadsFirstEntryOfDevice(
          device.externalId,
        );

      // Optimize by extracting timestamps to a Set for O(1) lookups
      const deltaReadTimestamps = new Set(
        firstDeltaRead.map((entry) => entry.readsEndDate.getTime()),
      );

      filteredReadings = filteredReadings.filter(
        (reading) => !deltaReadTimestamps.has(reading.timestamp.getTime()),
      );
    }

    this.logger.debug(
      `Filtered out ${filteredReadings.length}/${deviceReadings.length} readings for ${device.externalId}`,
    );

    const certifiedDevices =
      await this.deviceService.getCheckCertificateIssueDateLogForDevice(
        device.externalId,
        new Date(startDate.toString()),
        new Date(endDate.toString()),
      );

    this.logger.debug(
      `Found ${certifiedDevices.length} certified devices for ${device.externalId}`,
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

    this.logger.debug(
      `Filtered out ${filteredReadings.length}/${deviceReadings.length} readings for ${device.externalId}`,
    );

    const totalReadValue = filteredReadings.reduce(
      (sum, reading) => sum + reading.value,
      0,
    );

    this.logger.debug(
      `Total read value for ${device.externalId} is ${totalReadValue}`,
    );

    return {
      totalReadValue,
      filteredReadings,
    };
  }

  /**
   * Processes device reads to identify valid devices and collect reading data
   */
  @Profile()
  private async getDeviceReading(
    device: IDevice,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<{
    totalRead: number;
    filteredReadings: DeviceReading[];
    completeReads: DeviceReading[];
  }> {
    const allReadsForDeviceBetweenTimeRange = await this.readsService.find(
      device.externalId,
      {
        offset: 0,
        limit: 5000,
        start: startDate.toString(),
        end: endDate.toString(),
      },
    );

    // Filter out readings that have already been certified
    const { totalReadValue, filteredReadings } =
      await this.filterOutCertifiedReads(
        device,
        startDate,
        endDate,
        allReadsForDeviceBetweenTimeRange,
      );

    if (totalReadValue === 0)
      return {
        totalRead: 0,
        filteredReadings,
        completeReads: allReadsForDeviceBetweenTimeRange,
      };

    return {
      totalRead: totalReadValue,
      filteredReadings,
      completeReads: allReadsForDeviceBetweenTimeRange,
    };
  }
}
