import {
  IsEnum,
  IsISO31661Alpha2,
  IsString,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IFullOrganization } from '../../../models';
import { OrganizationStatus } from '../../../utils/enums';

export class UpdateOrganizationDTO
  implements Omit<IFullOrganization, 'id' | 'blockchainAccountAddress'>
{
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  address: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  zipCode: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  city: string;

  @ApiPropertyOptional({ type: String })
  @IsISO31661Alpha2()
  @IsOptional()
  country: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  businessType: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  tradeRegistryCompanyNumber: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  vatNumber: string;

  @ApiPropertyOptional({
    enum: OrganizationStatus,
    enumName: 'OrganizationStatus',
  })
  @IsEnum(OrganizationStatus)
  @IsString()
  @IsOptional()
  status: OrganizationStatus;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  signatoryFullName: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  signatoryAddress: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  signatoryZipCode: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  signatoryCity: string;

  @ApiPropertyOptional({ type: String })
  @IsISO31661Alpha2()
  @IsOptional()
  signatoryCountry: string;

  @ApiPropertyOptional({ type: String })
  @IsEmail()
  @IsOptional()
  signatoryEmail: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  signatoryPhoneNumber: string;
}
