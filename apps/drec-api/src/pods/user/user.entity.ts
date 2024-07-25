import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { ApiProperty } from '@nestjs/swagger';
import {
  Role,
  UserStatus,
  PermissionString,
  UserPermissionStatus,
} from '../../utils/enums';
import { IsEnum, IsString } from 'class-validator';
import { IUser } from '../../models';
import { Organization } from '../organization/organization.entity';
@Entity()
export class User extends ExtendedBaseEntity implements IUser {
  constructor(user: Partial<User>) {
    super();

    Object.assign(this, user);
  }

  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  // @ApiProperty({ type: String })
  // @Column({ nullable: true })
  // @IsString()
  // title: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  firstName: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  lastName: string;

  // @ApiProperty({ type: String })
  // @Column({ nullable: true })
  // @IsString()
  // telephone: string;

  @ApiProperty({ type: String })
  @Column({ unique: true })
  @IsString()
  email: string;

  @ApiProperty({ type: String })
  @Column({ select: false })
  @Exclude()
  @IsString()
  password: string;

  @Column({ nullable: true })
  notifications: boolean;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  @Column({ default: UserStatus.Pending, nullable: true })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Column()
  @IsEnum(Role)
  role: Role;

  @Column()
  @Exclude()
  roleId: number;

  @ApiProperty({ type: Organization })
  @ManyToOne(() => Organization, (organization) => organization.users, {
    onDelete: 'CASCADE',
  })
  organization: Organization;

  // @ApiProperty({ type: () => [ACLModulePermissions] })
  // @OneToMany(() => ACLModulePermissions, (permission) => permission.user, {
  //   eager: true,
  // })
  @IsEnum(PermissionString)
  permissions?: PermissionString;

  moduleName: string;

  @Column({ nullable: true })
  updatedAt: Date;

  @Column()
  api_user_id: string;

  // @BeforeUpdate()
  // updateTimestamp() {
  //   this.updatedAt = new Date(); // Set the updatedAt field to the current date and time
  // }

  @IsEnum(UserPermissionStatus)
  permission_status?: UserPermissionStatus;
}
