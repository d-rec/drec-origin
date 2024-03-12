import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsString,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { IDeltaintermediate } from '../../models/Delta_firstread';
import { Unit } from '@energyweb/energy-api-influxdb';
@Entity({ name: 'delta_firstread' })
export class DeltaFirstRead
  extends ExtendedBaseEntity
  implements IDeltaintermediate
{
  constructor(deltafirstreadvalue?: Partial<IDeltaintermediate>) {
    super();
    Object.assign(this, deltafirstreadvalue);
  }
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ enum: Unit })
  @Column()
  @IsEnum(Unit)
  unit: Unit;

  @ApiProperty({ type: Date })
  @Column()
  @IsString()
  readsEndDate: Date;

  @ApiProperty({ type: Number })
  @Column()
  @IsNumber()
  readsvalue: number;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  externalId: string;

  @ApiProperty({ type: Date })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  @IsOptional()
  updatedAt: Date;
}
