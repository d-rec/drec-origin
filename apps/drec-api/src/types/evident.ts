import { Device } from 'src/pods/device/device.entity';

export enum EvidentRegistrationStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
  InProgress = 'In Progress',
}

export enum EvidentIssuanceStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export type EvidentDeviceDetailsPayload = {
  deviceType: string;
  fuel: string;
  device: string;
  registrant: string;
  issuer: string;
  name: string;
  capacity: string;
  supported: boolean;
  latitude: string;
  longitude: string;
  registrationDate: string;
  commissioningDate: string;
  status: EvidentRegistrationStatus;
  active: boolean;
  address1: string;
  postcode: string;
  stateProvince: string;
  country: string;
  notes: string;
  files: string[];
};

export type EvidentIssuanceRequest = {
  code: string;
  startDate: string;
  endDate: string;
  productionVolume: string;
  notes?: string;
  recipientAccount: string;
  files: Record<string, any[]>;
  fuel: string;
  status: string;
};

export enum EvidentIssuanceRequestFrequency {
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  SemiAnnually = 'Semi-Annually',
}

export type DeviceGroupCertificatesAggregate = {
  device: Device;
  min_start_date: string;
  max_end_date: string;
  amount: number;
};
