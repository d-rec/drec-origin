import { ApiProperty } from '@nestjs/swagger';
import { IUser } from '../user.entity';

export class NewUserDTO implements Omit<IUser, 'id' | 'organizationId'> {
  @ApiProperty({ type: String })
  username: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  password: string;
}
