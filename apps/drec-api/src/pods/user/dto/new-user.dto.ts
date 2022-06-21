import { ApiProperty } from '@nestjs/swagger';
import { IModulePermissionsConfig, IUserProperties } from '../../../models';
import { Role, UserStatus } from '../../../utils/enums';
import { IsEnum } from 'class-validator';

export class NewUserDTO implements Omit<IUserProperties, 'id'> {
  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  firstName: string;

  @ApiProperty({ type: String })
  lastName: string;

  @ApiProperty({ type: String })
  telephone: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: Boolean })
  notifications: boolean;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  role: Role;
roleId:number;
  @ApiProperty({ type: String })
  password: string;
  // permissions: IModulePermissionsConfig;
  // moduleName: string;
  
}



