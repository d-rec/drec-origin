import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { DeviceDescription, IDevice } from '../../../models';
import { countryCodesList } from '../../../models/country-code';
import { ConvertToNullIfEmpty, Trim } from '../../../transformers/string';
import { UpperCase } from '../../../transformers/uppercase';
import { DocumentType } from '../../document-uploads/entities/documents.entity';
import {
  DeviceTypeCode,
  FuelCode,
  OffTaker,
  OperatingConfiguration,
  RegistrationType,
  SourceAccessMode,
  SubsidyType,
  VolumeEvidenceType,
  YesNo,
} from '../../../utils/enums';

export class NewDeviceDTO
  implements
    Omit<IDevice, 'id' | 'status' | 'organizationId' | 'labels' | 'groupId'>
{
  @ApiProperty()
  @Trim()
  @IsOptional()
  externalId?: string;

  @IsOptional()
  @IsString()
  operatorExternalId?: string;

  // Partial-draft registration (OC checklist multi-step workflow): every
  // registrant-entered field is optional at the API level. Reviewers can still
  // flag missing fields during auto-screen; completeness is enforced at approval
  // time, not submission time.
  @ApiProperty()
  @IsOptional()
  @IsString()
  dataSource: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  otherDataSource?: string;

  @ApiProperty()
  @IsOptional()
  @Trim()
  @Matches(/^[a-zA-Z0-9_;-]+$/, {
    message:
      'serialNumber must contain only letters, numbers, underscores, hyphens, or semicolons — no spaces allowed',
  })
  @IsString()
  serialNumber: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  siteName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  dataSourceBrand: string;

  @ApiProperty()
  @IsOptional()
  @IsString({
    message: 'Address must be added',
  })
  address: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(/^-?\d{1,3}(\.\d+)?$/, {
    message: 'Latitude should be a number from -90 to +90.',
  })
  latitude: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(/^-?\d{1,3}(\.\d+)?$/, {
    message: 'Longitude should be a number from -180 to +180.',
  })
  longitude: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @UpperCase()
  @IsIn(countryCodesList.map((value) => value.countryCode), {
    message:
      'Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
  })
  countryCode: string;

  @ApiProperty({ default: 'ES100' })
  @IsOptional()
  @IsEnum(FuelCode, {
    message: 'FuelCode must be added Or Valid FuelCode values are ES100',
  })
  fuelCode: FuelCode;

  @ApiProperty()
  // Empty string -> undefined so @IsOptional skips it (class-validator's
  // @IsOptional only skips null/undefined, not ''). A missing code is derived
  // from deviceDescription at register time; we never block an incomplete site.
  @Transform((value) => (value === '' || value == null ? undefined : value))
  @IsOptional()
  @IsEnum(DeviceTypeCode, {
    message:
      'DeviceCode must be added Or Valid DeviceCode values are TC110,TC120,TC130,TC140,TC150 ',
  })
  deviceTypeCode: DeviceTypeCode;

  /** Installed nameplate capacity in kW, as DC nameplate (kWp), not an AC /
   * inverter rating. Used as DC kWp by the Solar GSA yield model and the
   * production-ceiling check. */
  @ApiProperty({ description: 'Installed DC nameplate capacity in kW (kWp)' })
  @IsOptional()
  @IsNumber()
  @Min(0.001, {
    message: 'Invalid Capacity, it should be greater than 0',
  })
  @Transform((value) => (value == null ? undefined : parseFloat(value)))
  capacity: number;

  @ApiProperty()
  @IsOptional()
  @Transform((value) => new Date(value))
  @IsDate()
  commissioningDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  gridInterconnection: boolean;

  @ApiProperty({
    enum: OperatingConfiguration,
    description: 'Operating configuration per D-REC methodology',
  })
  @IsEnum(OperatingConfiguration, {
    message:
      'Valid operating configurations are: ' +
      Object.values(OperatingConfiguration).join(', '),
  })
  @IsOptional()
  operatingConfiguration?: OperatingConfiguration;

  @ApiProperty({
    enum: SourceAccessMode,
    description: 'Source-access mode per D-REC methodology (Mode 1–4)',
  })
  @IsEnum(SourceAccessMode, {
    message:
      'Valid source-access modes are: ' +
      Object.values(SourceAccessMode).join(', '),
  })
  @IsOptional()
  sourceAccessMode?: SourceAccessMode;

  @ApiProperty()
  @IsEnum(OffTaker, {
    message:
      'Valid OffTaker values are  Education , Health Facility , Residential , Commercial , Industrial , Public Sector,Agriculture,Off-Grid Community,Utility',
  })
  @IsOptional()
  offTaker: OffTaker;

  // @ApiProperty()
  // @IsEnum(Sector)
  // sector: Sector;

  // @ApiProperty()
  // @IsEnum(StandardCompliance)
  // standardCompliance: StandardCompliance;

  // @ApiProperty()
  // @IsArray()
  // @IsOptional()
  // generatorsIds: number[];

  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // labels: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  impactStory: string;

  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // data: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  images: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEnum(DeviceDescription, {
    message:
      'Valid Device Description are Solar Lantern, Solar Home System, Mini Grid, Rooftop Solar, Ground Mount Solar',
  })
  deviceDescription?: DeviceDescription;

  // @ApiProperty()
  // @IsNumber()
  // @IsOptional()
  // groupId?: number | null;
  @ApiProperty()
  @IsOptional()
  SDGBenefits?: string[];

  @ApiProperty({ default: '1.0' })
  @IsString()
  @IsOptional()
  @ConvertToNullIfEmpty()
  @ValidateIf(
    (o) => o.version === null || o.version === undefined || o.version === '0',
  )
  version = '1.0';

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  organizationId?: number | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  stateProvince?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  postcode?: string | null;

  // General (Evident checklist rows 2, 8)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultAccountCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requestedEffectiveRegDate?: string;

  // Signature & evidence pathway (Evident checklist rows 55-56, 58-59, 61-62)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  signatoryName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gridExportType?: string;

  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  hasNetworkMeter?: YesNo;

  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  meterReadsShareable?: YesNo;

  // Business details (Evident checklist rows 43, 45-48, 54)
  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  hasCaptiveConsumer?: YesNo;

  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  hasAuxiliaryEnergySources?: YesNo;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  auxiliaryEnergySourceDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nonMeterImportDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  otherEacSchemeRegistration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @ApiProperty({ required: false, type: 'object' })
  @IsOptional()
  fieldProvenance?: Record<
    string,
    { source: string; confidence: number; at: string; value?: any }
  > | null;

  // Facility technical (Evident checklist rows 32, 33, 35, 36)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  generatingUnitCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  networkOwner?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  interconnectionVoltage?: string;

  // Ownership & off-taker (Evident checklist rows 76, 77, 81)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pvSystemOwner?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pvSystemOwnerAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  offTakerName?: string;

  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  offTakerSameCompanyAsOwner?: YesNo;

  // Subsidies & incentives (rows 78, 79, 80)
  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  hasSubsidy?: YesNo;

  @ApiProperty({ required: false, enum: SubsidyType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SubsidyType, { each: true })
  subsidyTypes?: SubsidyType[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subsidyOtherDetails?: string;

  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  subsidyClaimsEacs?: YesNo;

  // Public funding (rows 50, 51)
  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  hasPublicFunding?: YesNo;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  publicFundingEndDate?: string;

  // SF-02 gaps
  @ApiProperty({ required: false, enum: RegistrationType })
  @IsOptional()
  @IsEnum(RegistrationType)
  registrationType?: RegistrationType;

  @ApiProperty({ required: false, enum: VolumeEvidenceType })
  @IsOptional()
  @IsEnum(VolumeEvidenceType)
  volumeEvidenceType?: VolumeEvidenceType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  labellingSchemeAccreditation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  verificationAgentName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  offGridCircumstances?: string;
}
export class DeviceRegistrationBody {
  [DocumentType.FORM_SF_02]: Express.Multer.File[];
  [DocumentType.SF_02C]: Express.Multer.File[];
  [DocumentType.PROOF_OF_OWNERSHIP]: Express.Multer.File[];
  [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
  [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
  [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
  [DocumentType.COD_PROOF]: Express.Multer.File[];
  [DocumentType.OTHER_DOCUMENTS]: Express.Multer.File[];
  deviceToRegister: NewDeviceDTO;
}

export type DeviceFiles = {
  [DocumentType.FORM_SF_02]: Express.Multer.File[];
  [DocumentType.SF_02C]: Express.Multer.File[];
  [DocumentType.PROOF_OF_OWNERSHIP]: Express.Multer.File[];
  [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
  [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
  [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
  [DocumentType.COD_PROOF]: Express.Multer.File[];
  [DocumentType.OTHER_DOCUMENTS]: Express.Multer.File[];
};
