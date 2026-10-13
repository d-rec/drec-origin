import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsEmail, IsEnum, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { OrganizationInvitationStatus, Role } from '../../utils/enums';
import { IOrganizationInvitation, OrganizationRole } from '../../models';
import { Organization } from '../organization/organization.entity';

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
  // Explicit type: `OrganizationRole` is a union of enum members, so
  // emitDecoratorMetadata reflects it as `Object` and TypeORM 0.3.30 refuses
  // to infer a column type from that (DataTypeNotSupportedError at boot). The
  // live column has always been `character varying`.
  @Column({ type: 'varchar', default: Role.SiteOperator })
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
