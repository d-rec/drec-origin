import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { ApiProperty } from '@nestjs/swagger';
import { RoleStatus } from '../../utils/enums';
import { IsEnum, IsString, IsArray } from 'class-validator';
import { IACLModuleConfig } from '../../models';
import { ACLModulePermissions } from '../permission/permission.entity';
@Entity('aclmodules')
export class AClModules extends ExtendedBaseEntity implements IACLModuleConfig {
  constructor(module: Partial<AClModules>) {
    super();

    Object.assign(this, module);
  }
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  description: string;

  @ApiProperty({ enum: RoleStatus, enumName: 'RoleStatus' })
  @Column({ default: RoleStatus.Enable, nullable: true })
  @IsEnum(RoleStatus)
  status: RoleStatus;

  @ApiProperty({ type: () => [String] })
  @Column('simple-array', { nullable: true })
  @IsArray()
  permissions: string[];

  @ApiProperty({ type: Number })
  @Column()
  permissionsValue: number;

  @OneToMany(
    () => ACLModulePermissions,
    (aclpermission) => aclpermission.aclmodules,
    {
      cascade: true,
    },
  )
  aclpermission: ACLModulePermissions[];
}
