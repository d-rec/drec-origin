import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserPermissionStatus } from '../../utils/enums';
import { IsEnum, IsArray } from 'class-validator';
@Entity({ name: 'api_user' })
export class ApiUserEntity {
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
