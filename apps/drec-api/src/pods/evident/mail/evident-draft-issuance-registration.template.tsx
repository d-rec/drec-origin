import { Text } from '@react-email/components';
import * as React from 'react';
import DefaultMailLayout from '../../../mail/layouts/default.layout';
import { Device } from '../../device/device.entity';
import type { EvidentIssuanceRequest } from '../../../types/evident';

export const getEvidentDraftIssuanceRegistrationSubject = (
  device: Device,
): string =>
  `Issuance Request Added As a Draft On Evident — ${device.projectName}`;

export default function EvidentDraftIssuanceRegistrationTemplate({
  device,
  organizationName,
  issuance,
}: {
  device: Device;
  organizationName: string;
  issuance: EvidentIssuanceRequest;
}): React.JSX.Element {
  return (
    <DefaultMailLayout>
      <Text>Dear {organizationName} Team,</Text>
      <Text>
        A Issuance Request has been created as a draft on the Evident platform.
      </Text>
      <Text>Device Details:</Text>
      <ul>
        <li>Project Name: {device.projectName}</li>
        <li>Device ID: {device.developerExternalId}</li>
        <li>Organization: {organizationName}</li>
        <li>Start Date: {issuance.startDate} </li>
        <li>End Date: {issuance.endDate} </li>
        <li>Total Readings: {issuance.productionVolume} </li>
      </ul>
      <Text>
        Please login into your D-REC dashboard to approve the submission to
        evident.
      </Text>
    </DefaultMailLayout>
  );
}
