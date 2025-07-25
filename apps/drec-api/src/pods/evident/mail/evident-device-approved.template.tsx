import { Text, Button } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../../../mail/layouts/default.layout';
import { Device } from '../../device/device.entity';

export const getEvidentDeviceApprovedSubject = (device: Device): string =>
  `Device Approved on Evident — ${device.projectName}`;

export default function EvidentDeviceApprovedTemplate({
  device,
  organizationName,
}: {
  device: Device;
  organizationName: string;
}): React.JSX.Element {
  const logInURL = process.env.UI_BASE_URL;
  return (
    <DefaultMailLayout>
      <Text>Dear {organizationName} Team,</Text>
      <Text>
        The following device registration has been approved on the Evident
        platform:
      </Text>
      <Text>Device Details:</Text>
      <ul>
        <li>Project Name: {device.projectName}</li>
        <li>Device ID: {device.developerExternalId}</li>
        <li>Organization: {organizationName}</li>
      </ul>
      <Text>The device is now active and eligible for issue requests.</Text>
      <Button
        style={{
          backgroundColor: '#2557d3',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '5px',
        }}
        href={logInURL}
      >
        Log In to Your Account
      </Button>
    </DefaultMailLayout>
  );
}
