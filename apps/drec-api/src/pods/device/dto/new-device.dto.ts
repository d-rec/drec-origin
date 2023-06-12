import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Matches
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
import { DeviceDescription, IDevice } from '../../../models';
import { Exclude ,} from 'class-transformer';

export class NewDeviceDTO
  implements Omit<IDevice, 'id' | 'status' | 'organizationId' | 'yieldValue' | 'labels' | 'groupId'>
{
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z\d\-_\s]+$/, {
    message:
      'external id can contain only alphabets( lower and upper case included), numeric(0 to 9), hyphen(-), underscore(_) and spaces in between',
  })
  externalId: string;


  @IsOptional()
  @IsString()
  @Exclude()
  developerExternalId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  projectName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Matches(/^-?\d+(\.\d{1,2})?$/, {
    message:
      'latitude should be number',
  })
  latitude: string;
  
  @ApiProperty()
  @IsString()
  @Matches(/^-?\d+(\.\d{1,2})?$/, {
    message:
      'longitude should be number',
  })
  @IsOptional()
  longitude: string;

  @ApiProperty()
  @IsString()
  countryCode: string;

  // @ApiProperty()
  // @IsOptional()
  // @IsString()
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
  // installationConfiguration: Installation;

  @ApiProperty()
  @IsNumber()
  capacity: number;

  @ApiProperty()
  @IsString({message:'Invalid commissioning date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z'})
  commissioningDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  gridInterconnection: boolean;

  @ApiProperty()
  @IsEnum(OffTaker,{
    message:
      'Valid OffTaker values are  School , Health Facility , Residential , Commercial , Industrial , Public Sector,Agriculture',
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
  @IsNumber()
  @IsOptional()
  energyStorageCapacity: number;

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

  @ApiProperty({ default: "1.0"})
  @IsString()
  @IsOptional()
  version: string="1.0";


}
