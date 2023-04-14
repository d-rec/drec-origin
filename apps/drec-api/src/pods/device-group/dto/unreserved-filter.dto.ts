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

export class UnreservedDeviceGroupsFilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Country Code' })
  country: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Fuel Code' })
  fuelCode: FuelCode;

  @IsOptional()
  @ApiPropertyOptional({
    type: Installation,
    description: 'Installation configuration',
    enum: Installation,
  })
  installationConfiguration: Installation;

  @IsOptional()
  @ApiPropertyOptional({
    type: OffTaker,
    description: 'Off-taker',
    enum: OffTaker,
  })
  offTaker: OffTaker;

  @IsOptional()
  @ApiPropertyOptional({
    type: Sector,
    description: 'Off-takers sectors',
    enum: Sector,
  })
  sector: Sector;

  @IsOptional()
  @ApiPropertyOptional({
    type: StandardCompliance,
    description: 'Standard Compliance',
    enum: StandardCompliance,
  })
  standardCompliance: StandardCompliance;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean, description: 'Grid Interconnection' })
  gridInterconnection: boolean;

  @IsOptional()
  @ApiPropertyOptional({
    type: CommissioningDateRange,
    description: 'Commissioning DateRange',
    enum: CommissioningDateRange,
  })
  commissioningDateRange: CommissioningDateRange;

  @IsOptional()
  @ApiPropertyOptional({
    type: CapacityRange,
    description: 'Capacity Range',
    enum: CapacityRange,
  })
  capacityRange: CapacityRange;
}
