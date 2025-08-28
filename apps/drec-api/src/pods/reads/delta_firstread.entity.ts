import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { IDeltaIntermediate } from '../../models/Delta_firstread';
import { Unit } from '../../types/reads';
@Entity({ name: 'delta_firstread' })
export class DeltaFirstRead
  extends ExtendedBaseEntity
  implements IDeltaIntermediate
{
  constructor(deltaFirstReadValue?: Partial<IDeltaIntermediate>) {
    super();
    Object.assign(this, deltaFirstReadValue);
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
