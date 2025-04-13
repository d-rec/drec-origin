import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { DateTime } from 'luxon';

import { getCycleEndDate } from '../../lib/helpers/getCycleEndDate';
import { Device } from '../device';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { EndReservationDateDTO } from '../device-group/dto';
import { DeviceService } from '../device/device.service';
import { OrganizationService } from '../organization/organization.service';
import { IssuerService } from './issuer.service';

@Injectable()
export class OngoingIssuanceService {
  private readonly logger = new Logger(OngoingIssuanceService.name);

  constructor(
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private issuerService: IssuerService,
  ) {}

  /**
   * Scheduled job that runs every 30 seconds to process ongoing cycle's certificate issuance
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processIssuance(): Promise<void> {
    this.logger.debug('Starting ongoing cycle certificate issuance check');

    // Fetch all pending certificate requests
    const groupsRequestAll =
      await this.groupService.getAllNextRequestCertificate();

    if (groupsRequestAll.length === 0) {
      this.logger.debug('No pending certificate issuance requests found');
      return;
    }

    this.logger.debug(
      `Processing ${groupsRequestAll.length} certificate issuance requests`,
    );

    // Process all requests in parallel, ensuring proper binding of 'this'
    await Promise.all(
      groupsRequestAll.map((request) =>
        this.processOngoingCycleByGroupRequest(request),
      ),
    );

    this.logger.debug('Certificate issuance check completed');
  }

  /**
   * Processes a single ongoing cycle for certificate issuance based on the given group request
   *
   * @param groupRequest - The certificate issuance request to process
   * @returns A promise that resolves when processing is complete
   */
  private async processOngoingCycleByGroupRequest(
    groupRequest: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    // Get group data
    const group = await this.groupService.findOne({ id: groupRequest.groupId });
    if (!group) {
      this.logger.error(`Group not found for ID: ${groupRequest.groupId}`);
      return;
    }

    // Load additional data
    group.loadLeftOverReadsByCountry();

    // Fetch required data in parallel
    const [countryDeviceGroup, organization] = await Promise.all([
      this.deviceService.newFindForGroup(group.id),
      this.organizationService.findOne(group.organizationId),
    ]);

    group.organization = {
      name: organization.name,
      blockchainAccountAddress: organization.blockchainAccountAddress,
    };

    // Process dates
    const startDate = DateTime.fromISO(groupRequest.start_date).toUTC();
    const endDate = DateTime.fromISO(groupRequest.end_date).toUTC();
    const startDateFormatted = endDate.toString();

    const isReservationEndDate =
      new Date(endDate.toString()).getTime() ===
      group.reservationEndDate.getTime();

    if (isReservationEndDate) {
      // Reservation end date case
      const endDTO = new EndReservationDateDTO();
      endDTO.endresavationdate = new Date(group.reservationEndDate);
      await this.groupService.endReservationGroup(
        group.id,
        group.organizationId,
        endDTO,
        group,
        groupRequest,
      );
    } else {
      // Normal certificate issuance case
      const newEndDate = await this.calculateOptimalEndDate(
        group,
        startDateFormatted,
        endDate,
      );

      await this.groupService.updateCertificateIssueDate(
        groupRequest.id,
        startDateFormatted,
        newEndDate,
      );
    }

    this.logger.debug(
      `Processing cycle for group ${group.id}: Start date ${startDate} - End date ${endDate}`,
    );

    await Promise.all([
      this.processDevicesWithMissingReadType(
        group,
        groupRequest,
        startDate,
        endDate,
      ),
      this.processByCountry(
        group,
        countryDeviceGroup,
        groupRequest,
        startDate,
        endDate,
      ),
    ]);
  }

  /**
   * Calculates the optimal end date for a certificate issuance cycle
   *
   * @param group - The device group
   * @param startDateFormatted - Formatted start date string
   * @param endDate - End date as DateTime object
   * @returns The optimal end date as ISO string
   */
  private async calculateOptimalEndDate(
    group: DeviceGroup,
    startDateFormatted: string,
    endDate: DateTime,
  ): Promise<string> {
    // Calculate end date based on group frequency
    const endDateFormatted = getCycleEndDate(
      endDate.toJSDate(),
      group.frequency,
    ).toISOString();

    // Determine appropriate end date
    let newEndDate: string;

    if (
      new Date(endDateFormatted).getTime() < group.reservationEndDate.getTime()
    ) {
      newEndDate = endDateFormatted;
    } else {
      newEndDate = group.reservationEndDate.toISOString();
    }

    try {
      // Check for devices onboarded within the cycle period
      const allDevicesOfGroup = await this.deviceService.findForGroup(group.id);

      // Sort devices by creation date (newest first)
      allDevicesOfGroup.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Find earliest device created between start and end dates
      const deviceInCyclePeriod = allDevicesOfGroup.find((device) => {
        const createdAt = new Date(device.createdAt).getTime();
        const startTime = new Date(startDateFormatted).getTime();
        const endTime = new Date(newEndDate).getTime();

        return createdAt > startTime && createdAt < endTime;
      });

      // If found, use device creation date as end date
      if (deviceInCyclePeriod) {
        newEndDate = new Date(deviceInCyclePeriod.createdAt).toISOString();
      }
    } catch (error) {
      this.logger.error(
        'Error checking for devices onboarded during cycle period',
        error,
      );
    }

    return newEndDate;
  }

  /**
   * Processes devices with missing meter read type and adds them to a late issuance cycle
   *
   * This function identifies devices that were created before the start date and have
   * a null meter read type, then registers them for late cycle processing.
   *
   * @param group - The device group containing the d evices
   * @param groupRequest - The certificate issuance request
   * @param startDate - Start date for the issuance cycle
   * @param endDate - End date for the issuance cycle
   */
  private async processDevicesWithMissingReadType(
    group: DeviceGroup,
    groupRequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<void> {
    const groupDevices = await this.deviceService.findForGroup(group.id);

    const devicesWithMissingReadType = groupDevices.filter(
      (device) =>
        device.meterReadtype === null &&
        new Date(device.createdAt).getTime() <=
          new Date(groupRequest.start_date).getTime(),
    );

    await Promise.all(
      devicesWithMissingReadType.map(async (device) => {
        await this.deviceService.addCycle(
          group.id,
          device.externalId,
          startDate,
          endDate,
        );
      }),
    );
  }

  /**
   * Processes devices grouped by country and issues certificates
   *
   * This function creates country-specific device groups and issues certificates
   * for each country. It processes countries in parallel when possible.
   *
   * @param group - The base device group
   * @param countryDeviceGroup - Map of countries to device arrays
   * @param groupRequest - The certificate issuance request
   * @param startDate - Start date for the issuance cycle
   * @param endDate - End date for the issuance cycle
   */
  private async processByCountry(
    group: DeviceGroup,
    countryDeviceGroup: Record<string, Device[]>,
    groupRequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<void> {
    // Process each country's devices
    for (const country in countryDeviceGroup) {
      // Create country-specific group using spread operator instead of deep cloning
      const devices = countryDeviceGroup[country];

      const countryGroup = {
        ...group,
        devices,
      } as DeviceGroup;

      await this.issuerService.issueCertificate(
        countryGroup,
        groupRequest,
        startDate,
        endDate,
        country,
      );
    }
  }
}
