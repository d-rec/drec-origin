import { Text, Button } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../../../mail/layouts/default.layout';
import { Device } from '../../device/device.entity';

export const getEvidentDeviceGroupRegistrationSubject = (
  device: Device,
): string => `Device Group Registration To Evident — ${device.projectName}`;

export default function EvidentDeviceGroupRegistrationTemplate({
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
        A new device group has been registered to the Evident platform.
      </Text>
      <Text>Device Group Details:</Text>
      <ul>
        <li>Project Name: {device.projectName}</li>
        <li>Device ID: {device.serialNumber}</li>
        <li>Organization: {organizationName}</li>
      </ul>
      <Text>Device Group was registered.</Text>
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
