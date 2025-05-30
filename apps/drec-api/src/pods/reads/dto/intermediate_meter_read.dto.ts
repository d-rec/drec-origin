import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { Unit } from '@energyweb/energy-api-influxdb';
import { ApiProperty } from '@nestjs/swagger';
import { ReadType } from '../../../utils/enums';
import { IIntermediate, NewReadDTO } from '../../../models';
import { PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsValidTimezone } from '../../../validations/timezone';
import { Transform, Type } from 'class-transformer';
import { transformTimezone } from '../../../transformers/timezone';
import { Trim } from '../../../transformers/string';

export class IntermediateMeterReadDTO implements Omit<IIntermediate, 'id'> {
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

export class NewIntermediateMeterReadDTO
  implements
    Omit<IIntermediate, 'id' | 'value' | 'startdate' | 'enddate' | 'createdAt'>
{
  @ApiProperty()
  @IsString()
  @IsOptional()
  @Trim()
  @IsValidTimezone()
  @Transform(transformTimezone)
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
  @Type(() => NewReadDTO)
  reads: NewReadDTO[];

  @ApiProperty({ type: () => Number })
  @IsOptional()
  organizationId?: number;
}
