import {
  IsISO31661Alpha2,
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IFullOrganization } from '../../../models';

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
  @IsString()
  businessType: string;

  @ApiProperty({ type: String })
  @IsString()
  tradeRegistryCompanyNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  vatNumber: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  signatoryFullName?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  signatoryAddress?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  signatoryZipCode?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  signatoryCity?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsISO31661Alpha2()
  signatoryCountry?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsEmail()
  signatoryEmail?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  signatoryPhoneNumber?: string;

  @ApiPropertyOptional({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  documentIds?: string[];

  @ApiPropertyOptional({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  signatoryDocumentIds?: string[];
}
