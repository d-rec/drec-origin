import { ApiProperty } from '@nestjs/swagger';
import {
  IModulePermissionsConfig,
  IAddModulePermission,
} from '../../../models';
import { EntityType, UserPermissionStatus } from '../../../utils/enums';
import { IsEnum, IsArray, IsOptional, IsInt } from 'class-validator';
import { PrimaryGeneratedColumn, Column } from 'typeorm';
export class PermissionDTO implements Omit<IModulePermissionsConfig, 'id'> {
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

  @ApiProperty({ type: [String] })
  @Column()
  @IsArray()
  permissions: string[];

  @Column()
  permissionValue: number;
  @ApiProperty({ type: Number })
  @Column({ default: 1 })
  status: number;
  // @ApiProperty({ type: ACLModuleDTO })
  // @ValidateNested()
  // aclmodules: IACLModuleConfig;
}
export class NewPermissionDTO {
  // NOTE: @Column() is a TypeORM decorator and does NOT keep a property
  // through the validation pipe's `whitelist: true` -- only class-validator
  // decorators do. Everything the service reads off the body therefore needs
  // a real rule; `permissionValue` is the one exception, see below.
  @ApiProperty({ type: Number })
  @Column()
  @IsInt()
  aclmodulesId: number;

  @ApiProperty({ enum: EntityType, enumName: 'EntityType' })
  @Column()
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({ type: Number })
  @Column({ nullable: true })
  @IsInt()
  @IsOptional()
  entityId: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  permissions: string[];

  // Intentionally undecorated: computed server-side by
  // DecimalPermissionValue.computePermissions() from `permissions` and spread
  // over the body value in PermissionService. Letting a client set it would
  // be a privilege escalation, so being stripped is exactly right.
  @Column()
  permissionValue: number;

  @ApiProperty({ type: Number })
  @Column({ default: 1 })
  @IsInt()
  @IsOptional()
  status: number;
}
export class UpdatePermissionDTO implements Omit<IAddModulePermission, 'id'> {
  // @ApiProperty({ type: Number })
  @Column()
  @IsInt()
  aclmodulesId: number;

  // @ApiProperty({ enum: EntityType, enumName: 'EntityType' })
  @Column()
  @IsEnum(EntityType)
  @IsOptional()
  entityType: EntityType;

  // @ApiProperty({ type: Number })
  @Column({ nullable: true })
  @IsOptional()
  entityId: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  permissions: string[];

  // Server-computed, see NewPermissionDTO.permissionValue.
  @Column()
  permissionValue: number;

  @ApiProperty({ type: Number })
  @IsInt()
  @IsOptional()
  status: number;
}

export class NewRegistrantPermissionDTO {
  @ApiProperty({ type: Number })
  @Column()
  @IsInt()
  aclmodulesId: number;

  //@ApiProperty({ enum: EntityType, enumName: 'EntityType' })
  @Column({ default: EntityType.User, nullable: true })
  @IsEnum(EntityType)
  entityType: EntityType;

  //@ApiProperty({ type: Number })
  @Column({ nullable: true })
  @IsInt()
  @IsOptional()
  entityId: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  permissions: string[];

  // Server-computed, see NewPermissionDTO.permissionValue.
  @Column()
  permissionValue: number;
}

export class RegistrantPermissionUpdateDTO {
  @ApiProperty({ enum: UserPermissionStatus, enumName: 'UserPermissionStatus' })
  @IsEnum(UserPermissionStatus)
  @Column({ default: UserPermissionStatus.Request })
  status: UserPermissionStatus;
}
