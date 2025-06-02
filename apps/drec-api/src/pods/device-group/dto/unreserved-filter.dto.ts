import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OffTaker, FuelCode, SDGBenefitsList } from '../../../utils/enums';
import { Transform } from 'class-transformer';

export class UnreservedDeviceGroupsFilterDTO {
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    description: 'string',
  })
  name: string;

  @IsOptional()
  @ApiPropertyOptional({
    description:
      'Filter by device IDs - accepts array of device IDs as strings. Can be sent as comma-separated string or array',
    type: [String],
    example: ['6', '3'],
  })
  @Transform((value) => {
    if (!value) return [];
    const values = Array.isArray(value) ? value : [value];
    const output = values
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0);
    return output;
  })
  deviceIds: string[];

  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    description: 'Filter with multiple Country Code :"IND,CAN"',
  })
  country: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Fuel Code',
    enum: FuelCode,
    isArray: true,
  })
  fuelCode: string[];

  @IsOptional()
  @ApiPropertyOptional({
    type: OffTaker,
    description: 'Off-taker',
    enum: OffTaker,
    isArray: true,
  })
  offTaker: OffTaker;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Start date reservationStartDate filter',
  })
  start_date: Date;

  @IsOptional()
  @ApiPropertyOptional({ description: 'End date reservationEndDate filter' })
  end_date: Date;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'SDG Benefit',
    enum: SDGBenefitsList,
    isArray: true,
  })
  sdgbenefit: string[];

  @ApiPropertyOptional({
    description: 'Reservation Active or Deactive',
    enum: ['All', 'Active', 'Deactive'],
  })
  @IsOptional()
  reservationActive: string;
  // @IsOptional()
  // @ApiPropertyOptional({
  //   type: OffTaker,
  //   description: 'Off-taker',
  //   enum: OffTaker,
  // })
  // SDG: OffTaker;

  // @IsOptional()
  // @ApiPropertyOptional({ type: Boolean, description: 'Grid Interconnection' })
  // gridInterconnection: boolean;

  // @IsOptional()
  // @ApiPropertyOptional({
  //   type: CommissioningDateRange,
  //   description: 'Commissioning DateRange',
  //   enum: CommissioningDateRange,
  // })
  // commissioningDateRange: CommissioningDateRange;

  // @IsOptional()
  // @ApiPropertyOptional({
  //   type: CapacityRange,
  //   description: 'Capacity Range',
  //   enum: CapacityRange,
  // })
  // capacityRange: CapacityRange;
}
