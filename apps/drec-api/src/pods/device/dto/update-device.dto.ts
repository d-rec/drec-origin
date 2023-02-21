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
  FuelCode,
  DevicetypeCode
} from '../../../utils/enums';
import { IDevice } from '../../../models';
import { Exclude } from 'class-transformer';
export class UpdateDeviceDTO
  implements Omit<IDevice, 'id' | 'externalId' | 'status' | 'organizationId' | 'yieldValue' | 'labels'>
{
  @ApiProperty()
  @IsOptional()
  @IsString()
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
      'Valid DeviceCode values are TC110,TC120,TC130,TC140,TC150 ',
  })
  @IsOptional()
  deviceTypeCode: DevicetypeCode;

  // @ApiProperty()
  // @IsEnum(Installation)
  // @IsOptional()
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
  @IsEnum(OffTaker,{
    message:
      'Valid OffTaker values are  School , HealthFacility , Residential , Commercial , Industrial , PublicSector,Agriculture',
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

  // @ApiProperty()
  // @IsArray()
  // @IsOptional()
  // generatorsIds: number[];

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

  @ApiProperty({ type: () => [String] })
  @IsArray()
  @IsOptional()
  SDGBenefits?: string[];
 
  @IsString()
  @IsOptional()
  meterReadtype?: string;
}
