import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBulkUploadDTO {
  @ApiProperty()
  @IsNumber()
  id: string;

  @ApiProperty()
  @IsNumber()
  bulkUploadId: string;

  @ApiProperty()
  details: any;
}
