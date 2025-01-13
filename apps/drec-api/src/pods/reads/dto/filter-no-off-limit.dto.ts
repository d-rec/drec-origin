/* */
import { IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export enum AccumulationType {
  monthly = 'Monthly',
  yearly = 'Yearly',
}

export enum ReadType {
  accumulated = 'accumulated',
  meterReads = 'meterReads',
}

export class FilterNoOffLimit {
  @ApiProperty({ enum: ReadType, description: 'Specify the type of reads' })
  readType: ReadType;

  @IsOptional()
  @ApiProperty({
    description: 'Example : 2020-01-01T00:00:00Z',
    required: false,
  })
  start: Date;

  @ApiProperty({
    description: 'Example : 2020-01-01T00:00:00Z',
    required: false,
  })
  end: Date;

  @ApiProperty({
    enum: AccumulationType,
    enumName: 'accumulationType',
    required: false,
  })
  accumulationType: AccumulationType;

  limit: number;

  offset: number;

  @IsOptional()
  @ApiProperty({
    type: Number,
    required: false,
    description: "Mention when it's requested from Apiuser",
  })
  organizationId?: number;
}
/* */
