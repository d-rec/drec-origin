import {
  IsISO31661Alpha2,
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IFullOrganization,
  IPublicAddOrganization,
} from '../../../models';

export class NewOrganizationDTO
  implements
    Omit<IFullOrganization, 'id' | 'blockchainAccountAddress' | 'status'>
{
  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  address: string;

  @ApiProperty({ type: String })
  @IsString()
  zipCode: string;

  @ApiProperty({ type: String })
  @IsString()
  city: string;

  @ApiProperty({ type: String })
  @IsISO31661Alpha2()
  country: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  organizationType: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // tradeRegistryCompanyNumber: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // vatNumber: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // signatoryFullName?: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // signatoryAddress?: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // signatoryZipCode?: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // signatoryCity?: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsISO31661Alpha2()
  // signatoryCountry?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsEmail()
  orgEmail?: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // signatoryPhoneNumber?: string;

  @ApiPropertyOptional({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  documentIds?: string[];

  @ApiPropertyOptional({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  signatoryDocumentIds?: string[];
}

export class NewAddOrganizationDTO
  implements Omit<IPublicAddOrganization, 'id' | 'status'>
{
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  // @ApiProperty({ type: String })
  // @MaxLength(6)
  // @Matches(/((?=.*[0-9])(?=.*[A-Z]).{6,})/, {
  //   message:
  //     'secret valye  must contain 6 characters (upper and/or lower case) and at least 1 digit',
  // })
  // @IsNotEmpty()
  // @IsString()
  // secretKey: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  organizationType: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  orgEmail: string;
}
