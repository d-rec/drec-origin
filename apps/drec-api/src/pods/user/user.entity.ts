import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';

export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  organizationId: string;
}

@Entity()
export class User extends ExtendedBaseEntity implements IUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({ unique: true })
  organizationId: string;
}
