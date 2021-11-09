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
  @MinLength(6)
  @MaxLength(20)
  @Matches(/((?=.*[0-9])(?=.*[a-z]).{6,})/, {
    message: 'password must contain at least one digit',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
