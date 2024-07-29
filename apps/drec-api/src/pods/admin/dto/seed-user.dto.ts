import { ApiProperty, PickType, IntersectionType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IUserSeed } from '../../../models';
import { UserDTO } from '../../user/dto/user.dto';
import { OrganizationDTO } from '../../organization/dto/organization.dto';

export class SeedUserDTO
  extends IntersectionType(
    PickType(UserDTO, [
      // 'title',
      'firstName',
      'lastName',
      'email',
      // 'telephone',
      'notifications',
      'status',
      'role',
      'organization',
    ] as const),
    PickType(OrganizationDTO, ['organizationType'] as const),
  )
  implements Omit<IUserSeed, 'organization' | 'id'>
{
  @ApiProperty({ type: String })
  @MaxLength(20)
  @Matches(/((?=.*[0-9])(?=.*[A-Za-z]).{6,})/, {
    message:
      'Password must contain minimum 6 characters (upper and/or lower case) and at least 1 digit',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ type: String })
  @MaxLength(20)
  @Matches(/((?=.*[0-9])(?=.*[A-Za-z]).{6,})/, {
    message:
      'Password must contain minimum 6 characters (upper and/or lower case) and at least 1 digit',
  })
  @ApiProperty({ type: Number })
  @IsNumber()
  organizationId: number;

  // permissions?: IModulePermissionsConfig;
  moduleName: string;
  roleId: number;
}
