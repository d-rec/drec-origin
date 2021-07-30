import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceIdsDTO {
  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @Min(1, { each: true })
  deviceIds: number[];
}
