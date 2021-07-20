import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IDevice } from '../device.entity';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../../utils/eums';

export class UpdateDeviceDTO
  implements
    Omit<IDevice, 'id' | 'drecID' | 'status' | 'registrant_organisation_code'>
{
  @ApiProperty()
  @IsString()
  @IsOptional()
  project_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  latitude: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  longitude: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  country_code: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  zip_code: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fuel_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  device_type_code: string;

  @ApiProperty()
  @IsEnum(Installation)
  @IsOptional()
  installation_configuration: Installation;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  capacity: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  commissioning_date: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  grid_interconnection: boolean;

  @ApiProperty()
  @IsEnum(OffTaker)
  @IsOptional()
  off_taker: OffTaker;

  @ApiProperty()
  @IsEnum(Sector)
  @IsOptional()
  sector: Sector;

  @ApiProperty()
  @IsEnum(StandardCompliance)
  @IsOptional()
  standard_compliance: StandardCompliance;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  yield_value: number;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  generators_ids: number[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  labels: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  impact_story: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  data: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  images: string[];
}
