import {
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
  IsDate
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Unit, ReadType } from '../../../utils/enums'
import { Iintermediate, NewReadDTO } from '../../../models';
import {
  YieldStatus,

} from '../../../utils/enums';

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
export class IntmediateMeterReadDTO
  implements Omit<Iintermediate, 'id'>
{
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ enum: ReadType, enumName: 'type' })
  @Column()
  @IsEnum(ReadType)
  type: ReadType;

  @ApiProperty({ enum: Unit, enumName: 'unit' })
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
  deviceId: string;

}

export class NewIntmediateMeterReadDTO
  implements Omit<Iintermediate, 'id' | 'value' | 'startdate' | 'enddate' | 'createdAt'>
{

  @ApiProperty({ enum: ReadType, enumName: 'type' })
  @IsEnum(ReadType)
  type: ReadType;

  @ApiProperty({ enum: Unit, enumName: 'unit' })
  @IsEnum(Unit)
  unit: Unit;
  
  @ApiProperty({ type: () => [NewReadDTO] })
  @IsArray()
  reads: NewReadDTO[];

}
