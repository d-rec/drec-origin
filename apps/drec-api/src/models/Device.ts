import {
  DeviceOrderBy,
  EvidencePathway,
  OffTaker,
  FuelCode,
  DeviceTypeCode,
  OperatingConfiguration,
  OwnershipStatus,
  SourceAccessMode,
  SubsidyType,
  YesNo,
  RegistrationType,
  VolumeEvidenceType,
  PublicFundingType,
} from '../utils/enums';

export interface IDevice {
  id: number;
  externalId?: string;
  serialNumber: string;
  operatorExternalId?: string;
  //status: DeviceStatus;
  organizationId: number;
  siteName: string;
  address?: string;
  latitude: string;
  longitude: string;
  countryCode: string;
  //zipCode?: string;
  fuelCode: FuelCode;
  deviceTypeCode: DeviceTypeCode;
  //installationConfiguration: Installation;
  capacity: number;
  commissioningDate: string;
  gridInterconnection: boolean;
  operatingConfiguration?: OperatingConfiguration;
  sourceAccessMode?: SourceAccessMode;
  evidencePathway?: EvidencePathway;
  ownershipStatus?: OwnershipStatus;
  offTaker: OffTaker;
  yieldValue: number;
  //generatorsIds?: number[];
  //labels?: string;
  impactStory?: string;
  //data?: string;
  images?: string[];
  groupId?: number | null;
  deviceDescription?: DeviceDescription;
  //integrator?: Integrator;
  SDGBenefits?: string[];
  meterReadtype?: string;
  createdAt?: Date;
  version?: string;
  timezone?: string;
  stateProvince?: string;
  postcode?: string;
  // General (Evident checklist rows 2, 8)
  defaultAccountCode?: string;
  requestedEffectiveRegDate?: string;
  // Signature & evidence pathway (Evident checklist rows 55-56, 58-59, 61-62)
  signatoryName?: string;
  gridExportType?: string; // 'No (zero-export)' | 'Yes (partial-export)' | 'Yes (full-export)'
  hasNetworkMeter?: YesNo;
  meterReadsShareable?: YesNo;
  // Business details (Evident checklist rows 43, 45-48, 54)
  hasCaptiveConsumer?: YesNo;
  hasAuxiliaryEnergySources?: YesNo;
  auxiliaryEnergySourceDetails?: string;
  nonMeterImportDetails?: string;
  otherEacSchemeRegistration?: string;
  additionalInfo?: string;
  // Facility technical (Evident checklist rows 32, 33, 35, 36)
  meterIds?: string[];
  generatingUnitCount?: number;
  networkOwner?: string;
  interconnectionVoltage?: string;
  // Ownership & off-taker (Evident checklist rows 76, 77, 81)
  pvSystemOwner?: string;
  offTakerName?: string;
  offTakerSameCompanyAsOwner?: YesNo;
  // Subsidies & incentives (rows 78, 79, 80)
  hasSubsidy?: YesNo;
  subsidyTypes?: SubsidyType[];
  subsidyOtherDetails?: string;
  subsidyClaimsEacs?: YesNo;
  // Public funding (rows 50, 51)
  hasPublicFunding?: YesNo;
  publicFundingEndDate?: string;

  // SF-02 gaps
  registrationType?: RegistrationType;
  volumeEvidenceType?: VolumeEvidenceType;
  publicFundingType?: PublicFundingType;
  labellingSchemeAccreditation?: string;
  verificationAgentName?: string;
  offGridCircumstances?: string;
}

export enum DeviceDescription {
  SolarLantern = 'Solar Lantern',
  SolarHomeSystem = 'Solar Home System',
  MiniGrid = 'Mini Grid',
  RooftopSolar = 'Rooftop Solar',
  GroundmountSolar = 'Ground Mount Solar',
}

export type DeviceKey =
  | 'id'
  | 'externalId'
  | 'status'
  | 'organizationId'
  | 'siteName'
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
  | 'yieldValue'
  | 'deviceDescription'
  | 'stateProvince'
  | 'postcode';

export type DeviceSortTypeValuedKeys = { [K in DeviceOrderBy]?: DeviceKey };

export const DeviceSortPropertyMapper: DeviceSortTypeValuedKeys = {
  [DeviceOrderBy.OffTaker]: 'offTaker' as DeviceKey,
  [DeviceOrderBy.FuelCode]: 'fuelCode' as DeviceKey,
  [DeviceOrderBy.Country]: 'countryCode' as DeviceKey,
  /* [DeviceOrderBy.StandardCompliance]: 'standardCompliance' as DeviceKey,
  [DeviceOrderBy.Sector]: 'sector' as DeviceKey,
  [DeviceOrderBy.InstallationConfiguration]:
    'installationConfiguration' as DeviceKey,
    */
  [DeviceOrderBy.GridInterconnection]: 'gridInterconnection' as DeviceKey,
  [DeviceOrderBy.Capacity]: 'capacity' as DeviceKey,
  [DeviceOrderBy.CommissioningDate]: 'commissioningDate' as DeviceKey,
};
