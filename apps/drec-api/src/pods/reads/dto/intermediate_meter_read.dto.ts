import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { Unit } from '@energyweb/energy-api-influxdb';
import { ApiProperty } from '@nestjs/swagger';
import { ReadType } from '../../../utils/enums';
import { Iintermediate, NewReadDTO } from '../../../models';
import { YieldStatus } from '../../../utils/enums';

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
export class IntmediateMeterReadDTO implements Omit<Iintermediate, 'id'> {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ enum: ReadType, enumName: 'type' })
  @Column()
  @IsEnum(ReadType)
  type: ReadType;

  @ApiProperty({ enum: Unit })
  @Column()
  @IsEnum(Unit)
  unit: Unit;

  @ApiProperty({ type: Date })
  @Column()
  @IsDate()
  createdAt: Date;
  @ApiProperty({ type: String })
  @Column()
  @IsString()
  externalId: string;
}

export class NewIntmediateMeterReadDTO
  implements
    Omit<Iintermediate, 'id' | 'value' | 'startdate' | 'enddate' | 'createdAt'>
{
  @ApiProperty()
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ enum: ReadType, enumName: 'type' })
  @IsEnum(ReadType)
  type: ReadType;

  @ApiProperty({ enum: Unit })
  @IsEnum(Unit)
  unit: Unit;

  @ApiProperty({ type: () => [NewReadDTO] })
  @IsArray()
  @ValidateNested()
  reads: NewReadDTO[];

  @ApiProperty({ type: () => Number })
  @IsOptional()
  organizationId?: number;
}
