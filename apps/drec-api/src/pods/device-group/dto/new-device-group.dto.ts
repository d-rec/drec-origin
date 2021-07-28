import { IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NewDeviceGroupDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsArray()
  deviceIds: number[];
}
