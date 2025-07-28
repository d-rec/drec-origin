import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Matches,
  Min,
  ValidateIf,
  IsIn,
  IsDate,
  MaxDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OffTaker, FuelCode, DeviceTypeCode } from '../../../utils/enums';
import { DeviceDescription, IDevice } from '../../../models';
import { Exclude, Transform } from 'class-transformer';
import { ConvertToNullIfEmpty } from '../../../transformers/string';
import { UpperCase } from '../../../transformers/uppercase';
import { countryCodesList } from '../../../models/country-code';
import { DocumentType } from '../../document-uploads/entities/documents.entity';
export class NewDeviceDTO
  implements
    Omit<
      IDevice,
      'id' | 'status' | 'organizationId' | 'yieldValue' | 'labels' | 'groupId'
    >
{
  @ApiProperty()
  @IsOptional()
  externalId?: string;

  @IsOptional()
  @IsString()
  @Exclude()
  developerExternalId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  projectName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dataSourceBrand: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString({
    message: 'Address must be added',
  })
  address: string;

  @ApiProperty()
  @IsString()
  @Matches(/^-?\d{1,2}(\.\d{1,9})?$/, {
    message:
      'Latitude should be number/The Latitude ranges from -90 to +90 degrees, with up to 9 decimal places. So, the maximum length could be 11 characters including the minus sign, digits, and decimal point ',
  })
  latitude: string;

  @ApiProperty()
  @IsString()
  @Matches(/^-?\d{1,3}(\.\d{1,9})?$/, {
    message:
      'Longitude should be number/The Longitude ranges from -180 to +180 degrees, with up to 9 decimal places. So, the maximum length could be 12 characters including the minus sign, digits, and decimal point',
  })
  longitude: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @UpperCase()
  @IsIn(countryCodesList.map((value) => value.countryCode), {
    message:
      'Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
  })
  countryCode: string;

  @ApiProperty({ default: 'ES100' })
  @IsNotEmpty()
  @IsEnum(FuelCode, {
    message: 'FuelCode must be added Or Valid FuelCode values are ES100',
  })
  fuelCode: FuelCode;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(DeviceTypeCode, {
    message:
      'DeviceCode must be added Or Valid DeviceCode values are TC110,TC120,TC130,TC140,TC150 ',
  })
  deviceTypeCode: DeviceTypeCode;

  @ApiProperty()
  @IsNumber()
  @Min(0.001, {
    message: 'Invalid Capacity, it should be greater than 0',
  })
  @Transform((value) => parseFloat(value))
  capacity: number;

  @ApiProperty()
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
  // @IsOptional()
  // @IsNumber()
  // yieldValue: number;

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

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  energyStorage: boolean;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0, {
    message:
      'Invalid Energy Storage Capacity, it should be equal or greater than 0',
  })
  @Transform((value) => {
    if (!value) return value;
    return parseFloat(value);
  })
  energyStorageCapacity: number | null;

  @ApiProperty()
  @IsString()
  @IsOptional()
  qualityLabels: string;

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
  @IsNumber()
  yieldValue?: number | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  stateProvince?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  postcode?: string | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fingerprint?: string | null;
}
export class DeviceRegistrationBody {
  [DocumentType.FORM_SF_02]: Express.Multer.File[];
  [DocumentType.SF_02C]: Express.Multer.File[];
  [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
  [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
  [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
  deviceToRegister: NewDeviceDTO;
}

export type DeviceFiles = {
  [DocumentType.FORM_SF_02]: Express.Multer.File[];
  [DocumentType.SF_02C]: Express.Multer.File[];
  [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
  [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
  [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
};
