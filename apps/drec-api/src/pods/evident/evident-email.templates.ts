import { Device } from '../device/device.entity';

export function deviceApprovedTemplate(device: Device): {
  subject: string;
  html: string;
} {
  return {
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
  };
}

export function deviceRejectedTemplate(device: Device): {
  subject: string;
  html: string;
} {
  return {
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
  };
}
