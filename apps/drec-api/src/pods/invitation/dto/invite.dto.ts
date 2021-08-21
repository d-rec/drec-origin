import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { OrganizationRole } from '../../../models';
import { Role } from '../../../utils/enums';

export class InviteDTO {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsNotEmpty()
  @IsEnum(Role)
  role: OrganizationRole;
}
