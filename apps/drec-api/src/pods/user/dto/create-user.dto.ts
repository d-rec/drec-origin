import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserDTO } from './user.dto';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRegistrationData } from '../../../models';

export class CreateUserDTO
  extends PickType(UserDTO, [
    'title',
    'firstName',
    'lastName',
    'email',
    'telephone',
  ] as const)
  implements UserRegistrationData
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
}
