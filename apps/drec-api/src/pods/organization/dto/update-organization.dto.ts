import {
  IsEnum,
  IsISO31661Alpha2,
  IsString,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IFullOrganization } from '../../../models';
import { OrganizationStatus } from '../../../utils/enums';

export class UpdateOrganizationDTO
  implements Omit<IFullOrganization, 'id' | 'blockchainAccountAddress'>
{
  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  zipCode: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({ type: String })
  @IsISO31661Alpha2()
  @IsOptional()
  country: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  businessType: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  tradeRegistryCompanyNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  vatNumber: string;

  @ApiProperty({ enum: OrganizationStatus, enumName: 'OrganizationStatus' })
  @IsEnum(OrganizationStatus)
  @IsString()
  @IsOptional()
  status: OrganizationStatus;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  signatoryFullName: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  signatoryAddress: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  signatoryZipCode: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  signatoryCity: string;

  @ApiProperty({ type: String })
  @IsISO31661Alpha2()
  @IsOptional()
  signatoryCountry: string;

  @ApiProperty({ type: String })
  @IsEmail()
  @IsOptional()
  signatoryEmail: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  signatoryPhoneNumber: string;
}
