import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IDevice } from '../device.entity';
import { Installation, OffTaker, Sector } from '../../../utils/eums';

export class UpdateDeviceDTO implements Omit<IDevice, 'id' | 'status'> {
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
  @IsString()
  @IsOptional()
  capacity: string;

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
  @IsString()
  @IsOptional()
  standard_compliance: string;

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
