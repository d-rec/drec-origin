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
  MaxDate,
  Min,
} from 'class-validator';
import { DeviceDescription, IDevice } from '../../../models';
import { countryCodesList } from '../../../models/country-code';
import { Trim } from '../../../transformers/string';
import { UpperCase } from '../../../transformers/uppercase';
import { DeviceTypeCode, FuelCode, OffTaker, OperatingConfiguration, PublicFundingType, RegistrationType, SourceAccessMode, SubsidyType, VolumeEvidenceType, YesNo } from '../../../utils/enums';
export class UpdateDeviceDTO
  implements
    Omit<
      IDevice,
      | 'id'
      | 'externalId'
      | 'status'
      | 'organizationId'
      | 'yieldValue'
      | 'labels'
    >
{
  @ApiProperty()
  @IsOptional()
  @Trim()
  @IsString()
  @Matches(/^[a-zA-Z\d\-_\s]+$/, {
    message:
      'external id can contain only alphabets( lower and upper case included), numeric(0 to 9), hyphen(-), underscore(_) and spaces in between',
  })
  externalId: string;

  @IsOptional()
  @IsString()
  operatorExternalId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  siteName: string;

  @ApiProperty()
  @IsOptional()
  @IsString({
    message: 'Address must be added',
  })
  address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Matches(/^-?\d{1,2}(\.\d{1,20})?$/, {
    message:
      'Latitude should be a number from -90 to +90, with up to 20 decimal places.',
  })
  latitude: string;

  @ApiProperty()
  @IsString()
  @Matches(/^-?\d{1,3}(\.\d{1,20})?$/, {
    message:
      'Longitude should be a number from -180 to +180, with up to 20 decimal places.',
  })
  @IsOptional()
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
  @IsEnum(FuelCode, {
    message: 'FuelCode must be added Or Valid FuelCode values are ES100',
  })
  @IsOptional()
  fuelCode: FuelCode;

  @ApiProperty()
  @IsEnum(DeviceTypeCode, {
    message:
      'DeviceCode must be added Or Valid DeviceCode values are TC110,TC120,TC130,TC140,TC150 ',
  })
  @IsOptional()
  deviceTypeCode: DeviceTypeCode;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_;-]+$/, {
    message:
      'serialNumber must contain only letters, numbers, underscores, hyphens, or semicolons — no spaces allowed',
  })
  serialNumber: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Min(0.001, {
    message: 'Invalid Capacity, it should be greater than 0',
  })
  @Transform((value) => parseFloat(value))
  capacity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform((value) => (value != null ? parseFloat(value) : undefined))
  acCapacity?: number;

  @ApiProperty()
  @IsOptional()
  @Transform((value) => new Date(value))
  @IsDate()
  @MaxDate(new Date(), {
    message: `Commissioning date cannot be in the future`,
  })
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
  // @IsOptional()
  // sector: Sector;

  // @ApiProperty()
  // @IsEnum(StandardCompliance)
  // @IsOptional()
  // standardCompliance: StandardCompliance;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  yieldValue: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  labels: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  impactStory: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  data: string;

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

  @ApiProperty()
  @IsString()
  @IsOptional()
  qualityLabels?: string;

  @ApiProperty({ type: () => [String] })
  @IsArray()
  @IsOptional()
  SDGBenefits?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  dataSource?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  otherDataSource?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  dataSourceBrand?: string;

  @IsString()
  @IsOptional()
  meterReadtype?: string;

  @IsString()
  @IsOptional()
  IREC_Status?: string;

  @IsString()
  @IsOptional()
  IREC_ID?: string;

  @IsOptional()
  organizationId?: number;

  @IsString()
  @IsOptional()
  postcode?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  stateProvince?: string | null;

  // General (rows 2, 8)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  defaultAccountCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requestedEffectiveRegDate?: string;

  // Signature & evidence pathway (rows 55-56, 58-59, 61-62)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  signatoryName?: string;

  @ApiProperty({ required: false, enum: YesNo })
  @IsOptional()
  @IsEnum(YesNo)
  isGridConnected?: YesNo;

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

  // Facility technical (Evident checklist rows 32, 33, 35, 36)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  meterIds?: string[];

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

  @ApiProperty({ required: false, enum: PublicFundingType })
  @IsOptional()
  @IsEnum(PublicFundingType)
  publicFundingType?: PublicFundingType;

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
