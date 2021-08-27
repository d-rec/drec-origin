import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserDTO } from './user.dto';
import { IsNotEmpty, IsString } from 'class-validator';
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
  @IsNotEmpty()
  @IsString()
  password: string;
}
