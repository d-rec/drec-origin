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

export class DeviceDTO implements IDevice {
  @ApiProperty()
  @IsString()
  id: string;

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
  fuel_code: string;

  @ApiProperty()
  @IsString()
  device_type_code: string;

  @ApiProperty()
  @IsEnum(Installation)
  installation_configuration: Installation;

  @ApiProperty()
  @IsString()
  capacity: string;

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
  @IsString()
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
}
