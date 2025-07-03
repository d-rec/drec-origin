import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { EvidentRegistrationStatus } from '../../types/evident';
import { Device } from '../device/device.entity';
import { deviceApprovedTemplate, deviceRejectedTemplate } from './evident-email.templates';

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
    let result: any;
    switch (deviceEvidentStatus) {
      case EvidentRegistrationStatus.Approved: {
        const { subject, html } = deviceApprovedTemplate(device);
        result = this.mailService.send({
          to: device.organization.orgEmail,
          subject,
          html,
        });
        break;
      }
      case EvidentRegistrationStatus.Rejected: {
        const { subject, html } = deviceRejectedTemplate(device);
        result = this.mailService.send({
          to: device.organization.orgEmail,
          subject,
          html,
        });
        break;
      }
      default:
        this.logger.warn(
          `No updated status for device: ${device.projectName}`,
        );
        break;
    }
    return result;
  }
}
