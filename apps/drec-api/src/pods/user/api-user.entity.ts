import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,OneToMany,BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus,PermissionString } from '../../utils/enums';
import { IsEnum, IsString } from 'class-validator';
import { IUser } from '../../models';
import { Organization } from '../organization/organization.entity';
import {ACLModulePermissions} from '../permission/permission.entity'
@Entity({ name: 'api_user'})
export class ApiUserEntity {    
  constructor() {

  }

  @PrimaryGeneratedColumn('uuid')
  api_user_id: string;
  

}
