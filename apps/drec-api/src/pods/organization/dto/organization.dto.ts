import {
  IsEnum,
  IsEthereumAddress,
  IsISO31661Alpha2,
  IsString,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IFullOrganization } from '../../../models';
import { Expose, plainToClass } from 'class-transformer';
import { OrganizationStatus } from '../../../utils/enums';
import { Organization } from '../organization.entity';

export class OrganizationDTO implements IFullOrganization {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Expose()
  id: number;

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

  @ApiProperty({ enum: OrganizationStatus, enumName: 'OrganizationStatus' })
  @IsEnum(OrganizationStatus)
  @IsString()
  status: OrganizationStatus;

  @ApiProperty({ type: String })
  @IsEthereumAddress()
  @Expose()
  blockchainAccountAddress: string;

  @ApiProperty({ type: String })
  @IsString()
  signatoryFullName: string;

  @ApiProperty({ type: String })
  @IsString()
  signatoryAddress: string;

  @ApiProperty({ type: String })
  @IsString()
  signatoryZipCode: string;

  @ApiProperty({ type: String })
  @IsString()
  signatoryCity: string;

  @ApiProperty({ type: String })
  @IsISO31661Alpha2()
  signatoryCountry: string;

  @ApiProperty({ type: String })
  @IsEmail()
  signatoryEmail: string;

  @ApiProperty({ type: String })
  @IsString()
  signatoryPhoneNumber: string;
}
