import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { IOrganizationUpdateMemberRole } from '../../../models';
import { Role } from '../../../utils/enums';

export class UpdateMemberDTO implements IOrganizationUpdateMemberRole {
  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
