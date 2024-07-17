import { ApiProperty } from '@nestjs/swagger';
import { IACLModuleConfig } from '../../../models';
import { RoleStatus } from '../../../utils/enums';
import {
  IsEnum,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';
import { PrimaryGeneratedColumn, Column, } from 'typeorm';

export class ACLModuleDTO implements Omit<IACLModuleConfig, 'id'> {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  name: string;

  @ApiProperty({ enum: RoleStatus, enumName: 'RoleStatus' })
  @IsEnum(RoleStatus)
  status: RoleStatus;

  @ApiProperty({ type: String })
  @Column()
  description: string;

  @ApiProperty({ type: () => [String] })
  @Column('simple-array', { nullable: true })
  @IsArray()
  permissions: string[];
  @ApiProperty({ type: Number })
  @Column()
  permissionsValue: number;
}
export class NewACLModuleDTO implements Omit<IACLModuleConfig, 'id'> {
  @ApiProperty({ type: String })
  @Column()
  @IsString()
  name: string;

  @ApiProperty({ enum: RoleStatus, enumName: 'RoleStatus' })
  @IsEnum(RoleStatus)
  status: RoleStatus;

  @ApiProperty({ type: String })
  @Column()
  description: string;

  @ApiProperty({
    type: () => [String],
    description: 'Add ( Read, Delete ,Update , Write )',
  })
  @Column('simple-array')
  @IsArray()
  permissions: string[];

  @Column()
  permissionsValue: number;
}

export class UpdateACLModuleDTO implements Omit<IACLModuleConfig, 'id'> {
  // @ApiProperty({ type: String })
  @Column()
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ enum: RoleStatus, enumName: 'RoleStatus' })
  @IsEnum(RoleStatus)
  @IsOptional()
  status: RoleStatus;

  // @ApiProperty({ type: String })
  @Column()
  @IsOptional()
  description: string;

  @ApiProperty({ type: () => [String] })
  @Column('simple-array')
  @IsArray()
  permissions: string[];

  @Column()
  @IsOptional()
  permissionsValue: number;
}
