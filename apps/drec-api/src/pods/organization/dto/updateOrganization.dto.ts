import {
  IsEnum,
  IsISO31661Alpha2,
  IsString,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IOrganization } from '../organization.entity';
import { Role } from '../../../utils/eums/role.enum';

export class UpdateOrganizationDTO
  implements Omit<IOrganization, 'code' | 'blockchainAccountAddress'>
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
  primaryContact: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  telephone: string;

  @ApiProperty({ type: String })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  regNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  vatNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  regAddress: string;

  @ApiProperty({ type: String })
  @IsISO31661Alpha2()
  @IsOptional()
  country: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  @IsOptional()
  role: Role;
}
