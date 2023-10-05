import { ApiProperty } from '@nestjs/swagger';
import { IModulePermissionsConfig, IACLModuleConfig, IaddModulePermission } from '../../../models';
import { Role, EntityType } from '../../../utils/enums';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ACLModuleDTO } from '../../access-control-layer-module-service/dto/aclmodule.dto';
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
  @IsArray()
  permissions: string[];

  @Column()
  permissionValue: number;

  @ApiProperty({ type: Number })
  @Column({ default: 1 })
  status: number;
}
export class UpdatePermissionDTO implements Omit<IaddModulePermission, 'id'> {

  // @ApiProperty({ type: Number })
  @Column()
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

  @Column()
  permissionValue: number;
  @ApiProperty({ type: Number })
  status: number;
}

export class NewApiUserPermissionDTO {

  @ApiProperty({ type: Number })
  @Column()
  aclmodulesId: number;

  //@ApiProperty({ enum: EntityType, enumName: 'EntityType' })
  @Column({ default: EntityType.User, nullable: true })
  @IsEnum(EntityType)
  entityType: EntityType;

  //@ApiProperty({ type: Number })
  @Column({ nullable: true })
  entityId: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  permissions: string[];

  @Column()
  permissionValue: number;

  // @ApiProperty({ type: Number })
  // @Column({ default: 1 })
  // status: number;
}