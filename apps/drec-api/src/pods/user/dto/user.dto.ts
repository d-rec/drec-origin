import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IUser } from '../user.entity';

export class UserDTO implements Omit<IUser, 'password'> {
  @ApiProperty({ type: Number })
  @Expose()
  id: number;

  @ApiProperty({ type: String })
  username: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  @Expose()
  organizationId: string;
}
