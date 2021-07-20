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

export class NewDeviceDTO
  implements Omit<IDevice, 'id' | 'status' | 'registrant_organisation_code'>
{
  @ApiProperty()
  @IsString()
  drecID: string;

  @ApiProperty()
  @IsString()
  project_name: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  latitude: string;

  @ApiProperty()
  @IsString()
  longitude: string;

  @ApiProperty()
  @IsString()
  country_code: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  zip_code: number;

  @ApiProperty()
  @IsString()
  fuel_code: string;

  @ApiProperty()
  @IsString()
  device_type_code: string;

  @ApiProperty()
  @IsEnum(Installation)
  installation_configuration: Installation;

  @ApiProperty()
  @IsNumber()
  capacity: number;

  @ApiProperty()
  @IsString()
  commissioning_date: string;

  @ApiProperty()
  @IsBoolean()
  grid_interconnection: boolean;

  @ApiProperty()
  @IsEnum(OffTaker)
  off_taker: OffTaker;

  @ApiProperty()
  @IsEnum(Sector)
  sector: Sector;

  @ApiProperty()
  @IsEnum(StandardCompliance)
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
