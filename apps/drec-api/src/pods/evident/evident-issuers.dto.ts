import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsString } from 'class-validator';

export class EvidentIssuersDTO {
  @ApiProperty()
  @IsString()
  issuerId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsArray()
  regions: string[];
}
