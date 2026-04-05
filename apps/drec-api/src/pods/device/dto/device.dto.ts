import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { DeviceDescription, IDevice } from '../../../models';
import { Trim } from '../../../transformers/string';
import { DeviceTypeCode, FuelCode, OffTaker, OperatingConfiguration, SourceAccessMode, SubsidyType, YesNo } from '../../../utils/enums';
export class DeviceDTO implements IDevice {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  externalId?: string;

  @ApiHideProperty()
  @IsString()
  operatorExternalId?: string;

  @ApiProperty()
  @Trim()
  @Matches(/^[a-zA-Z0-9_;-]+$/, {
    message:
      'serialNumber must contain only letters, numbers, underscores, hyphens, or semicolons — no spaces allowed',
  })
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // status: DeviceStatus;

  @ApiProperty()
  @IsNumber()
  organizationId: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  siteName: string;

  @ApiProperty()
  // @IsOptional()
  @IsString({
    message: 'Address must be added',
  })
  address: string;

  @ApiProperty()
  @IsString()
  // @IsOptional()
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
  // @IsOptional()
  longitude: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  countryCode: string;

  // @ApiProperty()
  // @IsOptional()
  // @IsNumber()
  // zipCode: string;

  @ApiProperty({ default: 'ES100' })
  @IsEnum(FuelCode, {
    message: 'FuelCode must be added Or Valid FuelCode values are ES100',
  })
  // @IsOptional()
  fuelCode: FuelCode;

  @ApiProperty()
  @IsEnum(DeviceTypeCode, {
    message:
      'DeviceCode must be added Or Valid DeviceCode values are TC110,TC120,TC130,TC140,TC150 ',
  })
  // @IsOptional()
  deviceTypeCode: DeviceTypeCode;

  // @ApiProperty()
  // @IsEnum(Installation)
  // installationConfiguration: Installation;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  capacity: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  commissioningDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  gridInterconnection: boolean;

  @ApiProperty({ enum: OperatingConfiguration })
  @IsEnum(OperatingConfiguration)
  @IsOptional()
  operatingConfiguration?: OperatingConfiguration;

  @ApiProperty({ enum: SourceAccessMode })
  @IsEnum(SourceAccessMode)
  @IsOptional()
  sourceAccessMode?: SourceAccessMode;

  @ApiProperty()
  @IsEnum(OffTaker)
  @IsOptional()
  offTaker: OffTaker;

  // @ApiProperty()
  // @IsEnum(Sector)
  // sector: Sector;

  // @ApiProperty()
  // @IsEnum(StandardCompliance)
  // standardCompliance: StandardCompliance;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  yieldValue: number;

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

  // @ApiProperty()
  // @IsString()
  // @IsOptional()
  // integrator?: Integrator;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEnum(DeviceDescription)
  deviceDescription?: DeviceDescription;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  energyStorage: boolean;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  energyStorageCapacity: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  qualityLabels: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  groupId?: number | null;

  @ApiProperty()
  @IsOptional()
  SDGBenefits?: string[];

  @ApiHideProperty()
  @IsString()
  @IsOptional()
  meterReadtype?: string;

  @ApiHideProperty()
  @IsString()
  @IsOptional()
  timezone: string;

  @ApiHideProperty()
  @IsOptional()
  createdAt?: Date;

  @ApiHideProperty()
  @IsString()
  @IsOptional()
  api_user_id?: string;

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
}
