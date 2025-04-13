import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DateTime } from 'luxon';

import { Queues } from '../../utils/enums/queues.enum';
import { Device } from '../device';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { DeviceService } from '../device/device.service';
import { DeviceLateOngoingIssueCertificateEntity } from '../device/device_lateongoing_certificate.entity';
import { OrganizationService } from '../organization/organization.service';
import { ReadsService } from '../reads/reads.service';
import { IssuerService } from './issuer.service';

@Injectable()
export class LateOngoingIssuanceService {
  private readonly logger = new Logger(LateOngoingIssuanceService.name);

  constructor(
    @InjectQueue(Queues.LateOngoingIssuance)
    private readonly lateOngoingQueue: Queue,
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private readsService: ReadsService,
    private issuerService: IssuerService,
  ) {}

  /**
   * Cron job that runs every 8 hours to schedule certificate issuance for active device groups
   *
   * @returns Promise that resolves when all jobs are queued
   */
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
   * Triggers certificate issuance for a specific group or schedules issuance for all active groups
   *
   * @param groupId - Optional ID of the specific group to process
   * @returns Promise resolving when issuance is triggered
   */
  async triggerIssuance(groupId?: number): Promise<void> {
    // If no group ID provided, schedule issuance for all active groups
    if (!groupId) return this.scheduleIssuance();

    // Add a job for the specified group ID
    await this.lateOngoingQueue.add(
      { groupId: groupId },
      {
        lifo: true,
      },
    );
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

      await this.processIssuanceForCycle(cycle);
    }
  }

  /**
   * Processes a single cycle for certificate issuance
   *
   * @param cycle - The cycle to process
   * @param index - The index of the cycle in the array
   * @returns Promise that resolves when processing is complete
   */
  private async processIssuanceForCycle(
    cycle: DeviceLateOngoingIssueCertificateEntity,
  ): Promise<void> {
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
      return;
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
      return;
    }

    // Fetch last read and next issuance data in parallel
    const [lastRead, nextIssuance] = await Promise.all([
      this.readsService.latestRead(device.externalId, device.createdAt),
      this.groupService.getGroupCertificateIssueDate({ groupId: group.id }),
    ]);

    // Handle missing read data
    if (!lastRead.length) {
      this.logger.error(`No readings found for device: ${device.externalId}`);
      return;
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

  /**
   * Checks and processes missing certificate cycles before late ongoing issuance
   *
   * @returns Promise that resolves when all missing cycles are processed
   */
  async getMissingCycle(): Promise<void> {
    this.logger.debug('Checking for missing certificate cycles');

    // Get active device groups
    const activeGroups = await this.groupService.getAllReservationActive();

    // Process each group sequentially to avoid overwhelming the system
    for (const group of activeGroups) {
      if (!group) {
        this.logger.error('Group data is missing');
        continue;
      }

      // Get devices for this group
      const devicesInGroup = await this.deviceService.findForGroup(group.id);

      // Pre-fetch next certificate request
      await this.groupService.getNextRequestCertificateByGroupId(group.id);
      await Promise.all(
        devicesInGroup.map(async (device) =>
          this.deviceService.checkForDeviceMissingCycles(group, device),
        ),
      );
    }
  }

  /**
   * Processes certificate issuance when last read is within the late cycle time range
   *
   * @param cycle - Late cycle entity
   * @param device - Device object
   * @param group - Device group
   * @param lastReadDate - Date of the last reading
   * @param nextIssuance - Next issuance information
   * @returns Promise resolving when processing is complete
   */
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
    ) {
      return;
    }

    await Promise.all([
      this.deviceService.updateLateOngoing(
        device.externalId,
        cycle.id,
        lastReadDate.toISOString(),
      ),
      this.deviceService.findOrCreateCycle(
        group.id,
        device.externalId,
        DateTime.fromJSDate(newStartDate).toUTC(),
        cycle.lateEndDateUTC,
      ),
    ]);

    this.logger.debug(
      'Late ongoing Issue Certificate For::',
      cycle.device_externalid,
    );

    await this.issuerService.issueCertificate(
      group,
      nextIssuance,
      cycle.lateStartDateUTC,
      DateTime.fromJSDate(lastReadDate).toUTC(),
      device.countryCode,
    );
  }

  /**
   * Issues certificates for readings when the last read is after the late end date
   *
   * @param cycle - The late ongoing issue certificate entity
   * @param device - The device object
   * @param group - The device group
   * @param nextIssuance - Next issuance information
   * @returns Promise that resolves when the process is complete
   */
  private async issueForRecentLastRead(
    cycle: DeviceLateOngoingIssueCertificateEntity,
    device: Device,
    group: DeviceGroup,
    nextIssuance: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    this.logger.verbose('dLast read greater then from late_end_date');

    const allReadsForDeviceBetweenTimeRange = await this.readsService.find(
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

    await this.issuerService.issueCertificate(
      group,
      nextIssuance,
      cycle.lateStartDateUTC,
      cycle.lateEndDateUTC,
      device.countryCode,
    );
  }
}
