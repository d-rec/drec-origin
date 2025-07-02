import { EvidentIssuanceRequest } from '../../types/evident';
import { Device } from '../device/device.entity';

export const draftIssuanceRegistrationTemplate = (
  device: Device,
  organizationName: string,
  issuance: EvidentIssuanceRequest,
): string => `
  <p>Hello,</p>
  <p>An Issuance Request has been created as a draft on the Evident platform.</p>
  <p>Device Details:</p>
  <ul>
  <li>Project Name: ${device.projectName}</li>
  <li>Device ID: ${device.developerExternalId}</li>
  <li>Organization: ${organizationName}</li>
  <li>Start Date: ${issuance.startDate} </li>
  <li>End Date: ${issuance.endDate} </li>
  <li>Total Readings: ${issuance.productionVolume} </li>
  </ul>
  <p>Please login into your D-REC dashboard to approve the issuance submission to the Issuer</p>
  <p>Best regards,</p>
  <p>D-REC Team</p>
      `;

export const draftIssuanceRegistrationSubject = (device: Device): string =>
  `Issuance Request Added As a Draft On Evident — ${device.projectName}`;
