import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsDate, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Unit } from '@energyweb/energy-api-influxdb';
import { ReadType } from '../../utils/enums';
import { Device } from '../device/device.entity';

@Entity({ name: 'meter_reads' })
export class MeterRead  {
  @ApiProperty({ type: Number })
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true,name:'external_id'})
    externalId: string;
  
    @ApiProperty({ enum: ReadType, enumName: 'type' })
    @Column()
    @IsEnum(ReadType)
    type: ReadType; 
  
    @Column({ type: 'double precision' })
    value: number;
    @ManyToOne(() => Device)
    @JoinColumn({ name: 'device_id' })
    device: Device;

    @ApiProperty({ enum: Unit, enumName: 'unit' })
    @Column()
    @IsEnum(Unit)
    unit: Unit;
  
    @Column({ type: 'timestamp', name:'start_date' })
    startDate: Date;
  
    @Column({ type: 'timestamp',name:'end_date' })
    endDate: Date;
  
    @Column({ default: false })
    certified: boolean;
    
  }
  