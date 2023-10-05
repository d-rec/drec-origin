import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { DeviceGroupDTO } from './device-group.dto';

export class SelectableDeviceGroupDTO extends DeviceGroupDTO {
  @ApiProperty()
  @IsBoolean()
  selected: boolean;
}
