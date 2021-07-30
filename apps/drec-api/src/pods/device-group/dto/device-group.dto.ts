import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IDeviceGroup } from '../device-group.entity';

export class DeviceGroupDTO implements IDeviceGroup {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  organizationId: string;
}
