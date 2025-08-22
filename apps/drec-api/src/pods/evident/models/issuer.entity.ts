import { IsString } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('issuer')
export class IssuerEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'issuer_id' })
  @IsString()
  issuerId: string;

  @Column()
  @IsString()
  name: string;

  @Column()
  @IsString()
  email: string;

  @Column()
  @IsString()
  country: string;

  @Column()
  @IsString()
  address: string;

  @Column('text', { array: true, nullable: false })
  regions: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
