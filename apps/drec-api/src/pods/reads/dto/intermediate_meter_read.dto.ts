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
import { Iintermediate, NewReadDTO } from '../../../models';
import { PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsValidTimezone } from '../../../validations/time-zone-validator';
import { Transform } from 'class-transformer';
import * as momentTimezone from 'moment-timezone';

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
  [key: string]: any;
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsValidTimezone()
  @Transform((value) => {
    if (!value) return value;
    const allTimezones = momentTimezone.tz.names();
    const index = allTimezones.findIndex(
      (tz) => tz.toLowerCase() === value.toLowerCase(),
    );
    return index >= 0 ? allTimezones[index] : value;
  })
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
