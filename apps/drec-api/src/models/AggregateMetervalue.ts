import { Unit } from '@energyweb/energy-api-influxdb';
import { IsDate, IsEmpty, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsTimestamp } from '../validations/timestamp';
import { ConvertToNullIfEmpty } from '../transformers/string';
export class NewReadDTO {
  @ApiProperty({ type: Date })
  @ConvertToNullIfEmpty()
  @IsOptional()
  @IsTimestamp()
  starttimestamp: Date;

  @ApiProperty({ type: Date })
  @IsTimestamp()
  endtimestamp: Date;

  @ApiProperty({ type: Number })
  @IsPositive()
  value: number;
}

export interface IAggregateintermediate {
  id: number;
  // type: string;
  unit: Unit;
  value: number;
  deltaValue: number;
  datetime: string;
  createdAt: Date;
  updatedAt: Date;
  externalId?: string;
}
export interface Iintermediate {
  id: number;
  type: string;
  unit: Unit;

  createdAt: Date;
  externalId?: string;
  reads?: NewReadDTO[];
  // status:YieldStatus;
}
