import {
  DeviceStatus,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../utils/eums';

export interface IDevice {
  id: number;
  drecID: string;
  status: DeviceStatus;
  organizationId: number;
  projectName: string;
  address: string;
  latitude: string;
  longitude: string;
  countryCode: string;
  zipCode?: number;
  fuelCode: string;
  deviceTypeCode: string;
  installationConfiguration: Installation;
  capacity: number;
  commissioningDate: string;
  gridInterconnection: boolean;
  offTaker: OffTaker;
  sector: Sector;
  standardCompliance: StandardCompliance;
  yieldValue: number;
  generatorsIds?: number[];
  labels?: string;
  impactStory?: string;
  data?: string;
  images?: string[];
  groupId?: number | null;
}
