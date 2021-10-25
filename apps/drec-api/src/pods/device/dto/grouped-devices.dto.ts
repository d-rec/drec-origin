import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceDTO } from './device.dto';
import { CapacityRange, CommissioningDateRange } from '../../../utils/enums';

export class UngroupedDeviceDTO extends DeviceDTO {
  @ApiProperty()
  @IsEnum(CommissioningDateRange)
  @IsNotEmpty()
  commissioningDateRange: CommissioningDateRange;

  @ApiProperty()
  @IsEnum(CapacityRange)
  @IsNotEmpty()
  capacityRange: CapacityRange;

  @ApiProperty()
  @IsBoolean()
  selected: boolean;
}

export class GroupedDevicesDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: [UngroupedDeviceDTO] })
  @IsArray()
  @IsOptional()
  devices: UngroupedDeviceDTO[];
}
