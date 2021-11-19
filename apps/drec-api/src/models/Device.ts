import {
  DeviceOrderBy,
  DeviceStatus,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../utils/enums';

export interface IDevice {
  id: number;
  externalId: string;
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

export type DeviceKey =
  | 'id'
  | 'externalId'
  | 'status'
  | 'organizationId'
  | 'projectName'
  | 'countryCode'
  | 'fuelCode'
  | 'deviceTypeCode'
  | 'installationConfiguration'
  | 'capacity'
  | 'commissioningDate'
  | 'gridInterconnection'
  | 'offTaker'
  | 'sector'
  | 'standardCompliance'
  | 'yieldValue';

export type DeviceSortTypeValuedKeys = { [K in DeviceOrderBy]?: DeviceKey };

export const DeviceSortPropertyMapper: DeviceSortTypeValuedKeys = {
  [DeviceOrderBy.OffTaker]: 'offTaker' as DeviceKey,
  [DeviceOrderBy.FuelCode]: 'fuelCode' as DeviceKey,
  [DeviceOrderBy.Country]: 'countryCode' as DeviceKey,
  [DeviceOrderBy.StandardCompliance]: 'standardCompliance' as DeviceKey,
  [DeviceOrderBy.Sector]: 'sector' as DeviceKey,
  [DeviceOrderBy.InstallationConfiguration]:
    'installationConfiguration' as DeviceKey,
  [DeviceOrderBy.GridInterconnection]: 'gridInterconnection' as DeviceKey,
  [DeviceOrderBy.Capacity]: 'capacity' as DeviceKey,
  [DeviceOrderBy.CommissioningDate]: 'commissioningDate' as DeviceKey,
};
