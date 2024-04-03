import {
  IsISO31661Alpha2,
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IFullOrganization } from '../../../models';
import { Expose } from 'class-transformer';
import { PublicOrganizationInfoDTO } from './public-organization-info.dto';

export class OrganizationDTO
  extends PublicOrganizationInfoDTO
  implements IFullOrganization
{
  // @ApiProperty({ type: String ,description: 'organizationType value should be Developer/Buyer'})
  // @IsString()
  // @IsNotEmpty()
  // @Expose()
  // organizationType: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // @Expose()
  // signatoryAddress: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // @Expose()
  // signatoryZipCode: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // @Expose()
  // signatoryCity: string;

  // @ApiProperty({ type: String })
  // @IsISO31661Alpha2()
  // @Expose()
  // signatoryCountry: string;

  // @ApiProperty({ type: String })
  // @IsEmail()
  // @Expose()
  // signatoryEmail: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // @Expose()
  // signatoryPhoneNumber: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @Expose()
  documentIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @Expose()
  signatoryDocumentIds?: string[];

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  blockchainAccountAddress?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  blockchainAccountSignedMessage?: string;
}
