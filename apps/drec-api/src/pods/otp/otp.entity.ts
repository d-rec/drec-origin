import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('otp')
export class Otp {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column()
  code: string;

  @Column({ name: 'expiration_time', type: 'bigint' })
  expirationTime: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
