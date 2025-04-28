import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('otp_verification')
export class OtpVerification {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phoneNumber: string;

  @Column()
  otp: string;

  @Column({ type: 'bigint' })
  expirationTime: number;

  @CreateDateColumn()
  createdAt: Date;
}
