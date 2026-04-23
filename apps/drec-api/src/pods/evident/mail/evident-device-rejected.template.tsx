import { Text, Button } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../../../mail/layouts/default.layout';
import { Device } from '../../device/device.entity';

export const getEvidentDeviceRejectedSubject = (device: Device): string =>
  `Device Rejected on Evident — ${device.projectName}`;

export default function EvidentDeviceRejectedTemplate({
  device,
  organizationName,
}: {
  device: Device;
  organizationName: string;
}): React.JSX.Element {
  const logInUrl = process.env.UI_BASE_URL;
  return (
    <DefaultMailLayout>
      <Text>Dear {organizationName} Team,</Text>
      <Text>
        The following device registration has been rejected on the Evident
        platform:
      </Text>
      <Text>Device Details:</Text>
      <ul>
        <li>Project Name: {device.projectName}</li>
        <li>Device ID: {device.serialNumber}</li>
        <li>Organization: {organizationName}</li>
      </ul>
      <Text>The device was rejected.</Text>
      <Button
        style={{
          backgroundColor: '#2557d3',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '5px',
        }}
        href={logInUrl}
      >
        Log In to Your Account
      </Button>
    </DefaultMailLayout>
  );
}
