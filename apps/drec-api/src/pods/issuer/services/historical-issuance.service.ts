import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../../lib/cron';

import { v4 as uuid } from 'uuid';

import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IDevice } from '../../../models';
import { HistoryNextIssuanceStatus } from '../../../utils/enums/history_next_issuance.enum';
import { Queues } from '../../../utils/enums/queues.enum';
import { CertificateLogService } from '../../certificate-log/certificate-log.service';
import { Device } from '../../device/device.entity';
import { DeviceGroup } from '../../device-group/device-group.entity';
import { DeviceGroupService } from '../../device-group/device-group.service';
import { HistoryDeviceGroupNextIssueCertificate } from '../../device-group/history_next_issuance_date_log.entity';
import { DeviceService } from '../../device/device.service';
import { OrganizationService } from '../../organization/organization.service';
import { HistoryIntermediateMeterRead } from '../../reads/history_intermideate_meterread.entity';
import { ReadsService } from '../../reads/reads.service';
import { CertificateService } from './certificate.service';
import { delay } from '../../../lib/helpers/delay';

@Injectable()
export class HistoricalIssuanceService {
  private readonly logger = new Logger(HistoricalIssuanceService.name);

  constructor(
    @InjectQueue(Queues.HistoricalIssuance)
    private readonly queue: Queue,
    private readonly groupService: DeviceGroupService,
    private readonly deviceService: DeviceService,
    private readonly organizationService: OrganizationService,
    private readonly readService: ReadsService,
    private readonly certificateService: CertificateService,
    private readonly certificateLogService: CertificateLogService,
  ) {}

  @NonConcurrentCron(CronExpression.EVERY_5_MINUTES)
  async scheduleIssuance(): Promise<void> {
    this.logger.debug('CRON [*/5m]: Historical certificate issuance check');

    // Get all pending historical issuance requests
    const historyDeviceRequests =
      await this.groupService.getNextHistoryIssuanceDeviceLog();

    if (historyDeviceRequests.length === 0) {
      this.logger.debug('No pending historical issuance requests found');
      return; // Early return if no requests
    }

    this.logger.verbose(
      `Processing ${historyDeviceRequests.length} historical issuance requests`,
    );

    // Process all requests in parallel
    await Promise.all(
      historyDeviceRequests.map((historyDevice, index) =>
        this.queue.add({
          request: historyDevice,
          requestIndex: index,
        }),
      ),
    );

    this.logger.debug('Historical issuance scheduled');
  }

  async processIssuance(): Promise<void> {
    // Get all pending historical issuance requests
    const historyDeviceRequests =
      await this.groupService.getNextHistoryIssuanceDeviceLog();

    // Process all requests in parallel
    await Promise.all(
      historyDeviceRequests.map((historyDevice, index) =>
        this.processIssuanceRequest(historyDevice, index),
      ),
    );
  }

  /**
   * Processes a single historical issuance request
   */
  async processIssuanceRequest(
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
        this.issueCertificate(group, historyRead, device),
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

    if (totalReadValueMegaWattHour === 0) return;

    // Use a consistent delay based on request index
    await delay(1000 * (requestIndex + 1));
    await this.groupService.updateTotalReadingRequestedForCertificateIssuance(
      group.id,
      group.organizationId,
      totalReadValueMegaWattHour,
    );
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

    // Check if device should be removed based on expiry date
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

  /**
   * Issues a new certificate for historical device reads
   *
   * @param group - The device group
   * @param deviceHistoryRequest - Historical meter read data
   * @param device - Device information
   * @returns Promise that resolves when the certificate is issued
   */
  async issueCertificate(
    group: DeviceGroup,
    deviceHistoryRequest: HistoryIntermediateMeterRead,
    device: IDevice,
  ): Promise<void> {
    // Early validation checks
    if (
      !group.buyerAddress ||
      !group.buyerId ||
      deviceHistoryRequest.readsvalue < 1000
    ) {
      return;
    }

    // Generate certificate transaction ID
    const certificateTransactionUID = uuid().toString();

    // Convert dates once to avoid repeated conversions
    const startDate = new Date(deviceHistoryRequest.readsStartDate.toString());
    const endDate = new Date(deviceHistoryRequest.readsEndDate.toString());
    const readValue = deviceHistoryRequest.readsvalue;

    // Get issuance parameters
    const issuance = this.certificateService.getIssuanceParams(
      group,
      [device],
      readValue,
      startDate,
      endDate,
      certificateTransactionUID,
    );

    // Log the issuance for debugging (consider using debug level instead)
    this.logger.debug(
      `Issuance for group ${group.name}: ${JSON.stringify(issuance)}`,
    );

    await Promise.all([
      // Create certificate log for device
      await this.certificateLogService.createForDevice(
        group,
        device,
        deviceHistoryRequest.readsStartDate,
        deviceHistoryRequest.readsEndDate,
        readValue,
        certificateTransactionUID,
      ),
      // Create certificate log for group
      this.certificateLogService.createForGroup(
        group,
        deviceHistoryRequest.readsStartDate,
        deviceHistoryRequest.readsEndDate,
        readValue,
        issuance,
        device.countryCode,
        certificateTransactionUID,
      ),
    ]);

    // Issue certificate
    await this.certificateService.issue(issuance);

    await this.readService.updateHistoryCertificateIssueDate(
      deviceHistoryRequest.id,
      deviceHistoryRequest.readsStartDate,
      deviceHistoryRequest.readsEndDate,
    );
  }
}
