import { Device } from '../device/device.entity';

export const draftDeviceRegistrationTemplate = (
  device: Device,
  organizationName: string,
): string => `
  <p>Hello,</p>
  <p>A new device registration has been submitted to the Evident platform.</p>
  <p>Device Details:</p>
  <ul>
  <li>Project Name: ${device.projectName}</li>
  <li>Device ID: ${device.developerExternalId}</li>
  <li>Organization: ${organizationName}</li>
  </ul>
  <p>You will be notified once the registration is reviewed.</p>
  <p>Best regards,</p>
  <p>D-REC Team</p>
      `;

export const draftDeviceRegistrationSubject = (device: Device): string =>
  `Device Registration Add As a Draft On Evident — ${device.projectName}`;
