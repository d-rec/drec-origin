import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceDTO } from './device.dto';

export class GroupedDevicesDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: [DeviceDTO] })
  @IsArray()
  @IsOptional()
  devices: DeviceDTO[];
}
