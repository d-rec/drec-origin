import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayMaxSize, IsArray, IsInt } from 'class-validator';

export class BulkDeleteDevicesDTO {
  @ApiProperty({ type: [Number], description: 'Device IDs to delete' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  ids: number[];
}
