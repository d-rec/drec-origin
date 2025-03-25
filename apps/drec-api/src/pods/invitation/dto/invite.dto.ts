import { ApiProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';
import {
  IsNotEmpty,
  IsEnum,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrganizationRole } from '../../../models';
import { Role } from '../../../utils/enums';
import { OrganizationInvitationStatus } from '../../../utils/enums';
export class InviteDTO {
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  telephone: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @Column({ default: Role.User })
  @IsNotEmpty()
  @IsEnum(Role)
  role: OrganizationRole;

  // @ApiProperty({ type: [NewPermissionDTO] })
  // @IsArray()
  // @IsOptional()
  // permissions: NewPermissionDTO[];

  @IsOptional()
  status?: string;
}
export class UpdateInviteStatusDTO {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: OrganizationInvitationStatus,
    enumName: 'OrganizationInvitationStatus',
  })
  @IsEnum(OrganizationInvitationStatus)
  status: OrganizationInvitationStatus;
}
