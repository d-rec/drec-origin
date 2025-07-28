import { Text, Button } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../../../mail/layouts/default.layout';
import { Device } from '../../device/device.entity';

export const getEvidentSubmittedDeviceRegistrationSubject = (
  device: Device,
): string => `Device Registration Submitted To Evident — ${device.projectName}`;

export default function EvidentSubmittedDeviceRegistrationTemplate({
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
        A new device registration has been submitted to the Evident platform.
      </Text>
      <Text>Device Details:</Text>
      <ul>
        <li>Project Name: {device.projectName}</li>
        <li>Device ID: {device.developerExternalId}</li>
        <li>Organization: {organizationName}</li>
      </ul>
      <Text>You will be notified once the registration is reviewed.</Text>
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
