import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class EvidentDeviceDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  fuel: string;
}

export class EvidentDeviceDetails extends EvidentDeviceDTO {
  @ApiProperty()
  @IsString()
  deviceType: string;

  @ApiProperty()
  @IsString()
  device: string;

  @ApiProperty()
  @IsString()
  registrant: string;

  @ApiProperty()
  @IsString()
  issuer: string;

  @ApiProperty()
  @IsString()
  capacity: string;

  @ApiProperty()
  @IsString()
  supported: boolean;

  @ApiProperty()
  @IsString()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;

  @ApiProperty()
  @IsDate()
  registrationDate: Date;

  @ApiProperty()
  @IsDate()
  commissioningDate: Date;

  @ApiProperty()
  @IsDate()
  expiryDate: Date;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsBoolean()
  active: boolean;

  @ApiProperty()
  @IsString()
  address1: string;

  @ApiProperty()
  @IsString()
  postcode: string;

  @ApiProperty()
  @IsString()
  stateProvince: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  notes: string;

  @ApiProperty()
  @IsString()
  issuerNotes: string;
}
