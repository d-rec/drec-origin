import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReadType } from '../../utils/enums';
import { Unit } from '../../types/reads';

@Entity({ name: 'meter_reads' })
export class MeterRead {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({
    name: 'external_id',
    type: 'citext',
  })
  externalId: string;

  @ApiProperty({ enum: ReadType, enumName: 'type' })
  @Column()
  @IsEnum(ReadType)
  type: ReadType;

  @ApiProperty()
  @Column({ type: 'double precision' })
  value: number;

  @ApiProperty({ enum: Unit, enumName: 'unit' })
  @Column()
  @IsEnum(Unit)
  unit: Unit;

  @ApiProperty()
  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', name: 'end_date' })
  endDate: Date;

  @ApiProperty()
  @Column({ default: false })
  certified: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  get timestamp(): Date {
    return this.endDate;
  }

  set timestamp(value: Date) {
    this.endDate = value;
  }
}
