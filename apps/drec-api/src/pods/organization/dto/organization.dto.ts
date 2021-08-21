import {
  IsEthereumAddress,
  IsISO31661Alpha2,
  IsString,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IFullOrganization } from '../../../models';
import { Expose } from 'class-transformer';
import { PublicOrganizationInfoDTO } from './public-organization-info.dto';

export class OrganizationDTO
  extends PublicOrganizationInfoDTO
  implements IFullOrganization
{
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
