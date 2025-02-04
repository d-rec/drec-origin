import { IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DeviceTypeCode,
  FuelCode,
  OffTaker,
  SDGBenefitsList,
} from '../../../utils/enums';

export class FilterDTO {
  @IsOptional()
  @ApiPropertyOptional({
    type: FuelCode,
    description: 'Fuel Code',
    enum: FuelCode,
  })
  fuelCode: FuelCode;

  @IsOptional()
  @ApiPropertyOptional({
    type: DeviceTypeCode,
    description: 'Device Type Code',
    enum: DeviceTypeCode,
  })
  deviceTypeCode: DeviceTypeCode;

  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'Amount Read from ',
  })
  fromAmountread: number;

  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'Amount Read to ',
  })
  toAmountread: number;
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    description: 'External device ID for filtering certificates',
  })
  deviceId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    type: OffTaker,
    description: 'Off-taker',
    enum: OffTaker,
  })
  offTaker: OffTaker;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Certificate Start date filter' })
  start_date: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Certificate End date filter' })
  end_date: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Country' })
  country: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'SDG Benefit',
    enum: SDGBenefitsList,
    isArray: true,
  })
  SDGBenefits?: string[] | undefined;
  @IsOptional()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'old certificate',
  })
  oldcertificatelog?: boolean;
}

export class GroupIDBasedFilteringDTO {
  @ApiProperty({ description: 'Group Id' })
  @IsNotEmpty()
  @IsNumberString()
  groupId: string;
}

export class AmountFormattingDTO {
  @ApiProperty({ type: String })
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}
