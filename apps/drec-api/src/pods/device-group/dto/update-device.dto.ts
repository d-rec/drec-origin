import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceGroupDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
