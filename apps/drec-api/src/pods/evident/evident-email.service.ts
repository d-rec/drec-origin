import { Injectable, Logger } from "@nestjs/common";
import { MailService } from "../../mail/mail.service";
import { EvidentRegistrationStatus } from "../../types/evident";
import { Device } from "../device/device.entity";

@Injectable()
export class EvidentEmailService {
  private readonly logger = new Logger(EvidentEmailService.name);
    constructor(
        private readonly mailService: MailService,
    ) {}

    async sendEmailToOrganizationWhenDeviceStatusChanges(device: Device, deviceEvidentStatus: string){
        this.logger.verbose(`With in sendEmailToOrganizationWhenDeviceStatusChanges`);
        switch(deviceEvidentStatus) {
          case EvidentRegistrationStatus.Approved:
            this.mailService.send({
              to: device.organization.orgEmail,
              subject: `Device Approved on Evident — ${device.projectName}`,
              html:`
              <p>Hello,</p>
              <pThe following device registration has been approved on the Evident platform:</p>
              <p>Device Details:</p>
              <ul>
                <li>Project Name: ${device.projectName}</li>
                <li>Device ID: ${device.externalId}</li>
                <li>Organization: ${device.organization.name}</li>
              </ul>
              <p>The device is now active and eligible for issue requests.</p>
              <p>Best regards,</p>
              <p>D-REC Team</p>
              `
            })
            return;
          case EvidentRegistrationStatus.Rejected:
            return
          default:
            return
        }
      }
}