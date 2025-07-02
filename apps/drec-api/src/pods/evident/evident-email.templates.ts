import { Device } from '../device/device.entity';

export const draftDeviceRegistrationTemplate = (
  device: Device,
  organizationName: string,
): string => `
<p>Hello,</p>
<p>A new device registration has been created as a draft on the Evident platform.</p>
<p>Device Details:</p>
<ul>
<li>Project Name: ${device.projectName}</li>
<li>Device ID: ${device.developerExternalId}</li>
<li>Organization: ${organizationName}</li>
</ul>
<p>Please login into your D-REC dashboard to approve the submission to evident</p>
<p>Best regards,</p>
<p>D-REC Team</p>
    `;

export const draftDeviceRegistrationSubject = (device: Device): string =>
  `Device Registration Add As a Draft On Evident — ${device.projectName}`;
