import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IUser } from '../../../models';
import { Role, UserStatus } from '../../../utils/eums';

export class UserDTO implements Omit<IUser, 'password'> {
  @ApiProperty({ type: Number })
  @Expose()
  id: number;

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

  @ApiProperty({ type: UserStatus })
  status: UserStatus;

  @ApiProperty({ type: Role })
  role: Role;

  @ApiProperty({ type: Number })
  @Expose()
  organizationId: number;
}
