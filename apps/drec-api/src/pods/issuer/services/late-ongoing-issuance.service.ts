import { Injectable, Logger } from '@nestjs/common';
import { NonConcurrentCron } from '../../../lib/cron';

import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DateTime } from 'luxon';

import { Queues } from '../../../utils/enums/queues.enum';
import { Device } from '../../device';
import { DeviceGroup } from '../../device-group/device-group.entity';
import { DeviceGroupService } from '../../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../../device-group/device_group_issuecertificate.entity';
import { DeviceService } from '../../device/device.service';
import { DeviceLateOngoingIssueCertificateEntity } from '../../device/device_lateongoing_certificate.entity';
import { OrganizationService } from '../../organization/organization.service';
import { ReadsService } from '../../reads/reads.service';
import { IssuerService } from './issuer.service';
import { Profile } from '../../../lib/profile';

@Injectable()
export class LateOngoingIssuanceService {
  private readonly logger = new Logger(LateOngoingIssuanceService.name);

  constructor(
    @InjectQueue(Queues.LateOngoingIssuance)
    private readonly lateOngoingQueue: Queue,
    @InjectQueue(Queues.MissingCycles)
    private readonly missingCyclesQueue: Queue,
    private readonly groupService: DeviceGroupService,
    private readonly deviceService: DeviceService,
    private readonly organizationService: OrganizationService,
    private readonly readsService: ReadsService,
    private readonly issuerService: IssuerService,
  ) {}

  /**
   * Cron job that runs every 8 hours to schedule certificate issuance for active device groups
   *
   * @returns Promise that resolves when all jobs are queued
   */
  @NonConcurrentCron('0 0 */8 * * *')
  async scheduleIssuance(): Promise<void> {
    this.logger.debug('CRON [*/8h]: Late ongoing certificate issuance check');
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
  @Profile()
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

      this.logger.log(
        `Processing cycle ${index + 1} of ${cycles.length}`,
        `Group:: ${cycle.groupId}`,
        'Device:: ' + cycle.device_externalid,
        'From: ' + cycle.lateStartDateUTC.toString(),
        'To: ' + cycle.lateEndDateUTC.toString(),
      );

      await this.processIssuanceForCycle(cycle);
    }

    // Update the last checked timestamp for the group
    groupId && (await this.deviceService.updateLateCycleCheckedAt(groupId));
  }

  /**
   * Processes a single cycle for certificate issuance
   *
   * @param cycle - The cycle to process
   * @param index - The index of the cycle in the array
   * @returns Promise that resolves when processing is complete
   */
  @Profile()
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
      this.readsService.latestRead(device.externalId),
      this.groupService.getGroupCertificateIssueDate({ groupId: group.id }),
    ]);

    // Handle missing read data
    if (!lastRead.length) {
      this.logger.debug(`No readings found for device: ${device.externalId}`);
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

    await this.processReads(cycle, device, group, nextIssuance);
  }

  async queueCreateMissingCycles(groupId?: number | string): Promise<void> {
    await this.missingCyclesQueue.add(
      { groupId },
      {
        lifo: true,
      },
    );
  }

  /**
   * Checks and processes missing certificate cycles before late ongoing issuance
   *
   * @returns Promise that resolves when all missing cycles are processed
   */
  async createMissingCycles(groupId?: number | string): Promise<void> {
    this.logger.debug('Checking for missing certificate cycles');

    // Get active device groups
    const activeGroups =
      await this.groupService.getAllReservationActive(groupId);

    // Process each group sequentially to avoid overwhelming the system
    for (const group of activeGroups) {
      if (!group) {
        this.logger.error('Group data is missing');
        continue;
      }

      // Get devices for this group
      const devicesInGroup = await this.deviceService.findForGroup(group.id);

      const { startDate } = this.groupService.calculateInitialIssuanceRange(
        devicesInGroup,
        group.reservationStartDate,
        group.reservationEndDate,
        group.frequency,
      );

      for (const device of devicesInGroup) {
        this.logger.log(
          `Checking for missing cycles for device: ${device.externalId} in group: ${group.id}`,
        );
        await this.deviceService.checkForDeviceMissingCycles(
          group,
          device,
          startDate,
        );
      }
    }
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
  @Profile()
  private async processReads(
    cycle: DeviceLateOngoingIssueCertificateEntity,
    device: Device,
    group: DeviceGroup,
    nextIssuance: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    this.logger.verbose('Last read greater then from late_end_date');

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
      'Reads founds: ' + allReadsForDeviceBetweenTimeRange?.length,
    );

    if (!allReadsForDeviceBetweenTimeRange?.length) {
      return;
    }

    await this.issueCertificate(
      group,
      nextIssuance,
      cycle.lateStartDateUTC,
      cycle.lateEndDateUTC,
      device.countryCode,
      cycle,
    );
  }

  /**
   * Issues a new certificate for a device group and archives the related late ongoing cycle
   *
   * @param group - The device group for which to issue a certificate
   * @param nextIssuance - Information about the next certificate issuance
   * @param startDate - The start date for the certificate validity period
   * @param endDate - The end date for the certificate validity period
   * @param countryCodeKey - The country code key used for certificate issuance
   * @param cycle - The late ongoing certificate cycle entity to be archived after issuance
   * @returns A Promise that resolves when both the certificate issuance and cycle archiving are complete
   */
  @Profile()
  private async issueCertificate(
    group: DeviceGroup,
    nextIssuance: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string,
    cycle: DeviceLateOngoingIssueCertificateEntity,
  ): Promise<void> {
    // Issue the certificate for the specified device group
    await this.issuerService.issueCertificate(
      group,
      nextIssuance,
      startDate,
      endDate,
      countryCodeKey,
    );

    await this.deviceService.updateLateOngoing(
      cycle.device_externalid,
      cycle.id,
    );

    // Archive the late ongoing cycle now that a certificate has been issued
    await this.deviceService.archiveOutdatedLateOngoingCycles(cycle);
  }

  /**
   * Archives all inactive late ongoing certificate cycles
   *
   * @returns A Promise that resolves when all inactive cycles have been processed
   */
  async removeInactiveCycles(): Promise<void> {
    // Retrieve the latest issued certificate cycles grouped by device and group
    const cycles =
      await this.deviceService.findLatestIssuedCyclesByDeviceAndGroup();

    // Exit early if no cycles were found
    if (!cycles?.length) {
      this.logger.error('No late ongoing read cycles found');
      return;
    }

    this.logger.debug(`Found ${cycles.length} cycles to process`);

    // Process each cycle to archive it
    for (const cycle of cycles) {
      this.deviceService.archiveOutdatedLateOngoingCycles(cycle);
    }

    this.logger.debug('Removed inactive cycles');
  }
}
