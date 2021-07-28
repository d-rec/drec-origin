import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceIdsDTO {
  @ApiProperty()
  @IsArray()
  deviceIds: number[];
}
