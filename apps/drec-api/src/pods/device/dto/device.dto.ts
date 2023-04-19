import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  Matches
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Installation,
  Integrator,
  OffTaker,
  Sector,
  StandardCompliance,
  FuelCode,
  DevicetypeCode
} from '../../../utils/enums';
import { DeviceStatus } from '@energyweb/origin-backend-core';
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
  @IsOptional()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+(\.\d{1,2})?$/, {
    message:
      'longitude should be number',
  })
  latitude: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+(\.\d{1,2})?$/, {
    message:
      'longitude should be number',
  })
  longitude: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  countryCode: string;

  // @ApiProperty()
  // @IsOptional()
  // @IsNumber()
  // zipCode: string;

  @ApiProperty()
  @IsEnum(FuelCode,{
    message:
      'Valid FuelCode values are ES100,ES990 ',
  })
  @IsOptional()
  fuelCode: FuelCode;

  @ApiProperty()
  @IsEnum(DevicetypeCode,{
    message:
      'Valid DeviceCode values are TC150 ',
  })
  @IsOptional()
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


  @IsOptional()
  createdAt?: Date;
}
