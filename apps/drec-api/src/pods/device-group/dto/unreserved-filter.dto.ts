import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
  FuelCode,
  SDGBenefitsList,
} from '../../../utils/enums';
import { countryCodesList } from '../../../models/country-code';
//import {SDGBenefits} from '../../../models/Sdgbenefit'
export class UnreservedDeviceGroupsFilterDTO {
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
