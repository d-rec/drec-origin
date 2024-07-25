import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IFullOrganization, IUser } from '../../../models';
import { Role, UserStatus } from '../../../utils/enums';

import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { OrganizationDTO } from '../../organization/dto';

export class UserDTO implements Omit<IUser, 'password'> {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Expose()
  id: number;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // title?: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  // @ApiPropertyOptional({ type: String })
  // @IsOptional()
  // @IsString()
  // telephone?: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: Boolean })
  @IsNotEmpty()
  @IsBoolean()
  notifications: boolean;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ type: OrganizationDTO })
  @ValidateNested()
  organization: IFullOrganization;

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  emailConfirmed?: boolean;

  // @IsOptional()
  //  permissions: IModulePermissionsConfig;
  // moduleName: string;
  // roleId:number;
}
