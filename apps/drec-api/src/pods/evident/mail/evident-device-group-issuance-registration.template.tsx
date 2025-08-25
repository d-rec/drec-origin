import { Text, Button } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../../../mail/layouts/default.layout';
import type { EvidentIssuanceRequest } from '../../../types/evident';
import { DeviceGroup } from '../../device-group/device-group.entity';

export const getEvidentDeviceGroupIssuanceRegistrationSubject = (
  deviceGroup: DeviceGroup,
): string =>
  `Issuance Request Added As a Draft On Evident — ${deviceGroup.name}`;

export default function EvidentDeviceGroupIssuanceRegistrationTemplate({
  deviceGroup,
  organizationName,
  issuance,
}: {
  deviceGroup: DeviceGroup;
  organizationName: string;
  issuance: EvidentIssuanceRequest;
}): React.JSX.Element {
  const logInUrl = process.env.UI_BASE_URL;
  return (
    <DefaultMailLayout>
      <Text>Dear {organizationName} Team,</Text>
      <Text>
        An Issuance Request has been created as a draft on the Evident platform.
      </Text>
      <Text>Device Details:</Text>
      <ul>
        <li>DeviceGroup Name: {deviceGroup.name}</li>
        <li>DeviceGroup ID: {deviceGroup.id}</li>
        <li>Organization: {organizationName}</li>
        <li>Start Date: {issuance.startDate} </li>
        <li>End Date: {issuance.endDate} </li>
        <li>Total Readings: {issuance.productionVolume} </li>
      </ul>
      <Text>
        Please login into your D-REC dashboard to approve the submission to
        evident.
      </Text>
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
