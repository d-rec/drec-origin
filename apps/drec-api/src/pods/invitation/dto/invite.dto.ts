import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsEmail } from 'class-validator';
import { OrganizationRole } from '../../../models';
import { Role } from '../../../utils/enums';

export class InviteDTO {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsNotEmpty()
  @IsEnum(Role)
  role: OrganizationRole;
}
