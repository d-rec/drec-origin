import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUploadDTO {
  @ApiProperty()
  @IsNumber()
  id: string;

  @ApiProperty()
  @IsNumber()
  bulkUploadId: string;

  @ApiProperty()
  errorDetails: any;
}
