import { Text } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../../../mail/layouts/default.layout';
import { Device } from '../../device/device.entity';

export const getEvidentDraftDeviceRegistrationSubject = (
  device: Device,
): string =>
  `Device Registration Add As a Draft On Evident — ${device.projectName}`;

export default function EvidentDraftDeviceRegistrationTemplate({
  device,
  organizationName,
}: {
  device: Device;
  organizationName: string;
}): React.JSX.Element {
  return (
    <DefaultMailLayout>
      <Text>Dear {organizationName} Team,</Text>
      <Text>
        A new device registration has been created as a draft on the Evident
        platform.
      </Text>
      <Text>Device Details:</Text>
      <ul>
        <li>Project Name: {device.projectName}</li>
        <li>Device ID: {device.developerExternalId}</li>
        <li>Organization: {organizationName}</li>
      </ul>
      <Text>
        Please login in to your D-REC dashboard to approve the submission to
        evident.
      </Text>
    </DefaultMailLayout>
  );
}
