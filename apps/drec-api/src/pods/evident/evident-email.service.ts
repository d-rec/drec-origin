import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { EvidentRegistrationStatus } from '../../types/evident';
import { Device } from '../device/device.entity';

@Injectable()
export class EvidentEmailService {
  private readonly logger = new Logger(EvidentEmailService.name);
  constructor(private readonly mailService: MailService) {}

  async notifyOrganizationOnDeviceStatusChange(
    device: Device,
    deviceEvidentStatus: string,
  ): Promise<boolean | void> {
    this.logger.verbose(
      `With in sendEmailToOrganizationWhenDeviceStatusChanges`,
    );
    switch (deviceEvidentStatus) {
      case EvidentRegistrationStatus.Approved:
        return this.mailService.send({
          to: device.organization.orgEmail,
          subject: `Device Approved on Evident — ${device.projectName}`,
          html: `
              <p>Hello,</p>
              <p>The following device registration has been approved on the Evident platform:</p>
              <p>Device Details:</p>
              <ul>
                <li>Project Name: ${device.projectName}</li>
                <li>Device ID: ${device.externalId}</li>
                <li>Organization: ${device.organization.name}</li>
              </ul>
              <p>The device is now active and eligible for issue requests.</p>
              <p>Best regards,</p>
              <p>D-REC Team</p>
              `,
        });
      case EvidentRegistrationStatus.Rejected:
        return this.mailService.send({
          to: device.organization.orgEmail,
          subject: `Device Rejected on Evident — ${device.projectName}`,
          html: `
              <p>Hello,</p>
              <p>The following device registration has been rejected on the Evident platform:</p>
              <p>Device Details:</p>
              <ul>
                <li>Project Name: ${device.projectName}</li>
                <li>Device ID: ${device.externalId}</li>
                <li>Organization: ${device.organization.name}</li>
              </ul>
              <p>The device was rejected.</p>
              <p>Best regards,</p>
              <p>D-REC Team</p>
              `,
        });
      default:
        return this.logger.warn(
          `No updated status for device: ${device.projectName}`,
        );
    }
  }
}
