import { IsEnum, IsISO31661Alpha2, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IOrganization } from '../organization.entity';
import { Role } from '../../../utils/eums/role.enum';

export class NewOrganizationDTO
  implements Omit<IOrganization, 'blockchainAccountAddress'>
{
  @ApiProperty({ type: String })
  @IsString()
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
  @IsEmail()
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

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  role: Role;
}
