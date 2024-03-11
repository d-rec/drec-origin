import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsEmail, IsEnum, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { OrganizationInvitationStatus, Role } from '../../utils/enums';
import { IOrganizationInvitation, OrganizationRole } from '../../models';
import { Organization } from '../organization/organization.entity';
import { BigNumber } from 'ethers';

@Entity({ name: 'organization_invitation' })
export class Invitation
  extends ExtendedBaseEntity
  implements IOrganizationInvitation
{
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @Column({ default: Role.DeviceOwner })
  @IsEnum(Role)
  role: OrganizationRole;

  @ApiProperty({
    enum: OrganizationInvitationStatus,
    enumName: 'OrganizationInvitationStatus',
  })
  @Column()
  @IsEnum(OrganizationInvitationStatus)
  status: OrganizationInvitationStatus;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  sender: string;

  @ManyToOne(() => Organization, (organization) => organization.invitations, {
    onDelete: 'CASCADE',
  })
  organization: Organization;

  @ApiProperty({ type: () => [Number] })
  @Column('simple-array', { nullable: true })
  @IsArray()
  permissionId: number[];
}
