import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../../utils/enums';
import { IDevice } from '../../../models';

export class UpdateDeviceDTO
  implements Omit<IDevice, 'id' | 'drecID' | 'status' | 'organizationId'>
{
  @ApiProperty()
  @IsString()
  @IsOptional()
  projectName: string;

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
  countryCode: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  zipCode: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fuelCode: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  deviceTypeCode: string;

  @ApiProperty()
  @IsEnum(Installation)
  @IsOptional()
  installationConfiguration: Installation;

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

  @ApiProperty()
  @IsEnum(Sector)
  @IsOptional()
  sector: Sector;

  @ApiProperty()
  @IsEnum(StandardCompliance)
  @IsOptional()
  standardCompliance: StandardCompliance;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  yieldValue: number;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  generatorsIds: number[];

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
}
