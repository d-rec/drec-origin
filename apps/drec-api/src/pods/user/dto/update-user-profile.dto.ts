import { PickType } from '@nestjs/swagger';
import { UserDTO } from './user.dto';

export class UpdateUserProfileDTO extends PickType(UserDTO, [
  // 'title',
  'firstName',
  'lastName',
  'email',
  // 'telephone',
] as const) {}
