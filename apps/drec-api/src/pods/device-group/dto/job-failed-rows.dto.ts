import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JobFailedRowsDTO {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  jobId: number;

  @ApiProperty()
  errorDetails: any;
}
