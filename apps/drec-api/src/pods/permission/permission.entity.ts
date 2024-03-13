import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { ApiProperty } from '@nestjs/swagger';
import { Role, EntityType } from '../../utils/enums';
import { IsEnum, IsString, IsArray } from 'class-validator';
import { IModulePermissionsConfig, IaddModulePermission } from '../../models';
import { User } from '../user/user.entity';
import { AClModules } from '../access-control-layer-module-service/aclmodule.entity';
@Entity({ name: 'aclmodulepermissions' })
export class ACLModulePermissions
  extends ExtendedBaseEntity
  implements IaddModulePermission
{
  constructor(aclmodulespermission: Partial<ACLModulePermissions>) {
    super();

    Object.assign(this, aclmodulespermission);
  }

  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Number })
  @Column()
  aclmodulesId: number;

  @ApiProperty({ enum: EntityType, enumName: 'EntityType' })
  @Column()
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({ type: Number })
  @Column({ nullable: true })
  entityId: number;

  @ApiProperty({ type: () => [String] })
  @Column('simple-array', { nullable: true })
  @IsArray()
  permissions: string[];

  @ApiProperty({ type: Number })
  @Column()
  permissionValue: number;

  @ApiProperty({ type: Number })
  @Column({ default: 1 })
  status: number;

  @ManyToOne(() => AClModules, (aclmodule) => aclmodule.aclpermission, {
    onDelete: 'CASCADE',
  })
  aclmodules: AClModules;
  // @ManyToOne(() => User, (user) => user.permissions, {
  //     onDelete: 'CASCADE',
  //   })
  //   user: User;
}
