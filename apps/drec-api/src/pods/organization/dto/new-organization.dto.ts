import { IsISO31661Alpha2, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
