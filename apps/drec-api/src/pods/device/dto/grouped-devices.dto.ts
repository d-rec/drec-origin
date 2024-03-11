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
import { BuyerReservationCertificateGenerationFrequency } from '../../../models';
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
  @ApiProperty({ type: Number })
  targetCapacityInMegaWattHour?: number;

  @ApiProperty({ type: Date })
  reservationStartDate?: Date;

  @ApiProperty({ type: Date })
  reservationEndDate?: Date;

  @ApiProperty({ type: Boolean })
  continueWithReservationIfOneOrMoreDevicesUnavailableForReservation?: boolean;

  @ApiProperty({ type: Boolean })
  continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration?: boolean;

  @ApiProperty({ type: Boolean })
  authorityToExceed?: boolean;

  @ApiProperty()
  @IsEnum(BuyerReservationCertificateGenerationFrequency)
  frequency?: BuyerReservationCertificateGenerationFrequency;
}
