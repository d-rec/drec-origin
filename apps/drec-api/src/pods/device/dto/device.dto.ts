import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OffTaker, FuelCode, DevicetypeCode } from '../../../utils/enums';
import { DeviceDescription, IDevice } from '../../../models';
import { Exclude } from 'class-transformer';
export class DeviceDTO implements IDevice {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  externalId: string;

  @IsString()
  @Exclude()
  developerExternalId?: string;

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
  projectName: string;

  @ApiProperty()
  // @IsOptional()
  @IsString({
    message: 'Address must be added',
  })
  address: string;

  @ApiProperty()
  @IsString()
  // @IsOptional()
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
  @IsEnum(DevicetypeCode, {
    message:
      'DeviceCode must be added Or Valid DeviceCode values are TC110,TC120,TC130,TC140,TC150 ',
  })
  // @IsOptional()
  deviceTypeCode: DevicetypeCode;

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

  @IsString()
  @IsOptional()
  meterReadtype?: string;

  @IsString()
  @IsOptional()
  timezone: string;

  @IsOptional()
  createdAt?: Date;

  @IsString()
  @IsOptional()
  api_user_id?: string;
}
