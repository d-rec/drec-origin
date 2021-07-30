import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NewDeviceGroupDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @Min(1, { each: true })
  deviceIds: number[];
}
