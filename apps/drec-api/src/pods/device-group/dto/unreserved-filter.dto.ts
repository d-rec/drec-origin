import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
  FuelCode
} from '../../../utils/enums';
import { countrCodesList } from '../../../models/country-code'
export class UnreservedDeviceGroupsFilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Country Code' })
  country: string;

  @IsOptional()
  @ApiPropertyOptional({ 
    type: FuelCode, 
    description: 'Fuel Code',
    enum: FuelCode
  
  })
  fuelCode: FuelCode;

 
 

  @IsOptional()
  @ApiPropertyOptional({
    type: OffTaker,
    description: 'Off-taker',
    enum: OffTaker,
  })
  offTaker: OffTaker;

  
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
