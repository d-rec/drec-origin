import {
  IsEnum,
  IsEthereumAddress,
  IsISO31661Alpha2,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { IOrganization } from './organization.entity';
import { Role } from '../../utils/eums/role.enum';
import { Expose } from 'class-transformer';

export class OrganizationDTO implements IOrganization {
  @ApiProperty({ type: String })
  @IsString()
  @Expose()
  code: string;

  @ApiProperty({ type: String })
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  address: string;

  @ApiProperty({ type: String })
  @IsString()
  primaryContact: string;

  @ApiProperty({ type: String })
  @IsString()
  telephone: string;

  @ApiProperty({ type: String })
  @IsString()
  email: string;

  @ApiProperty({ type: String })
  @IsString()
  regNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  vatNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  regAddress: string;

  @ApiProperty({ type: String })
  @IsISO31661Alpha2()
  country: string;

  @ApiProperty({ type: String })
  @IsEthereumAddress()
  @Expose()
  blockchainAccountAddress: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  @Expose()
  role: Role;
}
