import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,OneToMany } from 'typeorm';
import { IsNotEmpty, IsEnum, IsEmail, IsArray,IsOptional,IsString } from 'class-validator';
import { OrganizationRole } from '../../../models';
import { Role } from '../../../utils/enums';
import { Exclude } from 'class-transformer';
import {NewPermissionDTO} from '../../permission/dto/modulepermission.dto'
export class InviteDTO {
  
  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @Column({ default: Role.User})
  @IsNotEmpty()
  @IsEnum(Role)
  role: OrganizationRole;
  
  
  // @ApiProperty({ type: [NewPermissionDTO] })
  // @IsArray()
  // @IsOptional()
  // permissions: NewPermissionDTO[];
 
  @IsOptional()
  status?: string;
  
}
export class updateInviteStatusDTO {
 
}
