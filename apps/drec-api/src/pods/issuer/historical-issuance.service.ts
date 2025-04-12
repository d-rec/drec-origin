import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { FilterDTO } from '@energyweb/energy-api-influxdb';
import { IIssueCommandParams } from '@energyweb/origin-247-certificate';
import { HttpService } from '@nestjs/axios';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { ICertificateMetadata } from '../../utils/types';

import { IDevice } from '../../models';
import {
  CertificateType,
  ReadType,
  SingleDeviceIssuanceStatus,
  StandardCompliance,
} from '../../utils/enums';
import { HistoryNextIssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from '../device-group/check_certificate_issue_date_log_for_device_group.entity';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { HistoryDeviceGroupNextIssueCertificate } from '../device-group/history_next_issuance_date_log.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { DeviceService } from '../device/device.service';
import { OrganizationService } from '../organization/organization.service';
import { HistoryIntermediateMeterRead } from '../reads/history_intermideate_meterread.entity';
import { ReadsService } from '../reads/reads.service';
import { CertificateService } from './certificate.service';
import { LateOngoingIssuanceService } from './late-ongoing-issuance.service';
import { Device } from '../device';

@Injectable()
export class HistoricalIssuanceService {
  private readonly logger = new Logger(HistoricalIssuanceService.name);

  constructor(
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private readService: ReadsService,
    private httpService: HttpService,
    private readonly certificateService: CertificateService,
    private lateOngoingIssuanceService: LateOngoingIssuanceService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processHistoricalIssuance(): Promise<void> {
    this.logger.debug('Starting historical certificate issuance check');

    // Get all pending historical issuance requests
    const historyDeviceRequests =
      await this.groupService.getNextHistoryIssuanceDeviceLog();

    if (historyDeviceRequests.length === 0) {
      return; // Early return if no requests
    }

    this.logger.verbose(
      `Processing ${historyDeviceRequests.length} historical issuance requests`,
    );

    // Process all requests in parallel
    await Promise.all(
      historyDeviceRequests.map((historyDevice, index) =>
        this.processHistoricalIssuanceRequest(historyDevice, index),
      ),
    );

    this.logger.debug('Historical issuance cycle completed');
  }

  /**
   * Processes a single historical issuance request
   */
  private async processHistoricalIssuanceRequest(
    historyDevice: HistoryDeviceGroupNextIssueCertificate,
    requestIndex: number,
  ): Promise<void> {
    // Get group data
    const group = await this.groupService.findOne({
      id: historyDevice.groupId,
    });
    if (!group) {
      this.logger.error(`Group not found for ID: ${historyDevice.groupId}`);
      return;
    }

    // Get organization and device data in parallel
    const [organization, device] = await Promise.all([
      this.organizationService.findOne(group.organizationId),
      this.deviceService.findReads(historyDevice.device_externalid),
    ]);

    // Set organization data
    group.organization = {
      name: organization.name,
      blockchainAccountAddress: organization.blockchainAccountAddress,
    };

    // Get historical reads for the device within the reservation period
    const historyReads =
      await this.readService.getCheckHistoryCertificateIssueDateLogForDevice(
        historyDevice.device_externalid,
        historyDevice.reservationStartDate,
        historyDevice.reservationEndDate,
      );

    // Process historical reads if any exist
    if (historyReads?.length > 0) {
      await this.processHistoricalReads(
        group,
        device,
        historyReads,
        requestIndex,
      );
    }

    // Mark the request as completed
    await this.groupService.updateHistoryCertificateIssueDate(
      historyDevice.id,
      HistoryNextIssuanceStatus.Completed,
    );

    // Check if device should be removed from group
    await this.checkAndRemoveDeviceFromGroup(group, device);

    // Check if group reservation should be deactivated
    await this.checkAndDeactivateGroupReservation(group, historyDevice.groupId);
  }

  /**
   * Process historical reads for a device and issue certificates
   */
  private async processHistoricalReads(
    group: DeviceGroup,
    device: Device,
    historyReads: HistoryIntermediateMeterRead[],
    requestIndex: number,
  ): Promise<void> {
    // Issue certificates for each read
    await Promise.all(
      historyReads.map((historyRead) =>
        this.newHistoryIssueCertificateForDevice(group, historyRead, device),
      ),
    );

    // Calculate total using a chain of filters and reduce
    const totalReadsValue = historyReads
      // Only process reads when buyer information is present
      .filter(() => Boolean(group.buyerAddress && group.buyerId))
      // Only include reads that meet the minimum threshold (1kW = 1000W)
      .filter((read) => read.readsvalue >= 1000)
      .reduce((sum, read) => sum + read.readsvalue, 0);

    // Convert to MWh and update group totals if needed
    const totalReadValueMegaWattHour = totalReadsValue / 10 ** 6;

    if (totalReadValueMegaWattHour != 0) {
      // Use a consistent delay based on request index
      setTimeout(
        () => {
          this.groupService.updateTotalReadingRequestedForCertificateIssuance(
            group.id,
            group.organizationId,
            totalReadValueMegaWattHour,
          );
        },
        1000 * (requestIndex + 1),
      );
    }
  }

  /**
   * Check if device should be removed from group based on reservation dates
   */
  private async checkAndRemoveDeviceFromGroup(
    group: DeviceGroup,
    device: Device,
  ): Promise<void> {
    const now = new Date().getTime();
    const reservationEndTime = group.reservationEndDate.getTime();
    const deviceCreatedTime = new Date(device.createdAt).getTime();

    if (group.reservationExpiryDate) {
      const expiryTime = group.reservationExpiryDate.getTime();

      if (expiryTime <= reservationEndTime || expiryTime <= now) {
        await this.deviceService.removeFromGroup(device.id, group.id);
      }
    } else if (reservationEndTime <= deviceCreatedTime) {
      await this.deviceService.removeFromGroup(device.id, group.id);
    }
  }

  /**
   * Check if group reservation should be deactivated
   */
  private async checkAndDeactivateGroupReservation(
    group: DeviceGroup,
    groupId: number,
  ): Promise<void> {
    // Check if there are pending historical issuances or ongoing issuances
    const [pendingHistoricalCount, ongoingIssuance] = await Promise.all([
      this.groupService.countGroupIdHistoryIssuanceDeviceLog(groupId),
      this.groupService.getGroupCertificateIssueDate({ groupId }),
    ]);

    // Early return if there are pending historical issuances or ongoing issuances
    if (pendingHistoricalCount > 0 || ongoingIssuance) {
      return;
    }

    // If no expiry date exists, deactivate the reservation immediately
    if (!group.reservationExpiryDate) {
      await this.groupService.deactivateReservation(group);
      return;
    }

    // Check if expiry date has passed based on current time or reservation end date
    const now = new Date().getTime();
    const expiryTime = group.reservationExpiryDate.getTime();
    const reservationEndTime = group.reservationEndDate.getTime();

    if (expiryTime <= reservationEndTime || expiryTime <= now) {
      await this.groupService.deactivateReservation(group);
    }
  }
}
