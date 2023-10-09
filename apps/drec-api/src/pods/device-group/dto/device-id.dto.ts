import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceIdDTO {
  @ApiProperty()
  @IsNumber()
  id: number;
}
