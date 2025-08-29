/* */
import { IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export enum ReadType {
  accumulated = 'accumulated',
  meterReads = 'meterReads',
}

export class FilterNoOffLimit {
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
