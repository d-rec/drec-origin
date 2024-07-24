import { Entity, Column, PrimaryGeneratedColumn, } from 'typeorm';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { IAggregateintermediate } from '../../models';
import { Unit } from '@energyweb/energy-api-influxdb';
@Entity({ name: 'aggregate_meterread' })
export class AggregateMeterRead
  extends ExtendedBaseEntity
  implements IAggregateintermediate
{
  constructor(aggrgatevalue?: Partial<IAggregateintermediate>) {
    super();
    Object.assign(this, aggrgatevalue);
  }
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  //   @ApiProperty({ enum: ReadType, enumName: 'type'})
  //   @Column()
  //   @IsEnum(ReadType)
  //   type: ReadType;

  @ApiProperty({ enum: Unit })
  @Column()
  @IsEnum(Unit)
  unit: Unit;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  datetime: string;

  @ApiProperty({ type: Date })
  @IsDate()
  @IsOptional()
  updatedAt: Date;

  @ApiProperty({ type: Date })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ type: Number })
  @Column()
  @IsNumber()
  value: number;

  @ApiProperty({ type: Number })
  @Column()
  @IsNumber()
  deltaValue: number;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  externalId: string;
}
