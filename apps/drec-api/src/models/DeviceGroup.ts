import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../utils/enums';
import { DeviceDTO } from '../pods/device/dto';

export interface IDeviceGroup {
  id: number;
  name: string;
  organizationId: number;
  fuelCode: string;
  countryCode: string;
  standardCompliance: StandardCompliance;

  deviceTypeCodes: string[];
  offTakers: OffTaker[];
  installationConfigurations: Installation[];
  sectors: Sector[];
  gridInterconnection: boolean; // True - all devices have gridInterconnection true, if one has false, then this value is false
  aggregatedCapacity: number; // total capacity of all devices beloning to this group

  capacityRange: CapacityRange;
  commissioningDateRange: CommissioningDateRange[];

  yieldValue?: number; // ideally all underlying devices should have the same, otherwise take average?

  labels?: string[];

  devices?: DeviceDTO[];
}
