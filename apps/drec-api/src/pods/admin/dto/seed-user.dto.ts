import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IUserSeed } from '../../../models';
import { UserDTO } from '../../user/dto/user.dto';

export class SeedUserDTO
  extends PickType(UserDTO, [
    'title',
    'firstName',
    'lastName',
    'email',
    'telephone',
    'notifications',
    'status',
    'role',
  ] as const)
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

  @ApiProperty({ type: Number })
  @IsNumber()
  organizationId: number;
}
