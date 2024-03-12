import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserPermissionStatus } from '../../utils/enums';
import { IsEnum, IsString, IsArray } from 'class-validator';
import { IUser } from '../../models';
import { Organization } from '../organization/organization.entity';
import { ACLModulePermissions } from '../permission/permission.entity';
@Entity({ name: 'api_user' })
export class ApiUserEntity {
  constructor() {}

  @PrimaryGeneratedColumn('uuid')
  api_user_id: string;

  @ApiProperty({ enum: UserPermissionStatus, enumName: 'UserPermissionStatus' })
  @Column({ default: UserPermissionStatus.Request, nullable: true })
  @IsEnum(UserPermissionStatus)
  permission_status: UserPermissionStatus;

  @ApiProperty({ type: () => [Number] })
  @Column('simple-array', { nullable: true })
  @IsArray()
  permissionIds: number[];
}
