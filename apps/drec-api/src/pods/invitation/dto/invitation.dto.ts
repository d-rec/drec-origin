import { ApiProperty } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { IOrganizationInvitation, OrganizationRole } from '../../../models';
import { PublicOrganizationInfoDTO } from '../../organization/dto/public-organization-info.dto';
import { OrganizationInvitationStatus, Role } from '../../../utils/enums';
import { Invitation } from '../invitation.entity';
import { NewPermissionDTO } from '../../permission/dto/modulepermission.dto';
export class InvitationDTO implements IOrganizationInvitation {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  role: OrganizationRole;

  @ApiProperty({
    enum: OrganizationInvitationStatus,
    enumName: 'OrganizationInvitationStatus',
  })
  @IsEnum(OrganizationInvitationStatus)
  status: OrganizationInvitationStatus;

  @ApiProperty({ type: () => PublicOrganizationInfoDTO })
  @ValidateNested()
  organization: PublicOrganizationInfoDTO;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  sender: string;

  @ApiProperty({ type: Date })
  @IsNotEmpty()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsOptional()
  permissionId?: number[];

  public static fromInvitation(invitation: Invitation): InvitationDTO {
    return plainToClass(InvitationDTO, invitation);
  }
}
