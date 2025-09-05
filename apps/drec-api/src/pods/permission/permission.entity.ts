import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ExtendedBaseEntity } from '../../lib/entity/extended-base-entity';
import { ApiProperty } from '@nestjs/swagger';
import { EntityType } from '../../utils/enums';
import { IsEnum, IsArray } from 'class-validator';
import { IAddModulePermission } from '../../models';
import { AClModules } from '../access-control-layer-module-service/aclmodule.entity';
@Entity({ name: 'aclmodulepermissions' })
export class ACLModulePermission
  extends ExtendedBaseEntity
  implements IAddModulePermission
{
  constructor(aclModulePermission: Partial<ACLModulePermission>) {
    super();

    Object.assign(this, aclModulePermission);
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
