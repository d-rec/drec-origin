import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('otp')
export class OtpVerification {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column()
  otp: string;

  @Column({ name: 'expiration_time', type: 'bigint' })
  expirationTime: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
