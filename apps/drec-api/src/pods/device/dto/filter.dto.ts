import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../../utils/eums';

export class FilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Fuel Code' })
  fuel_code: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Device Type Code' })
  device_type_code: string;

  @IsOptional()
  @ApiPropertyOptional({
    type: Installation,
    description: 'Installation configuration',
  })
  installation_configuration: Installation;

  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'Search number for capacity',
  })
  capacity: number;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Start date Commissioning Date filter' })
  startDate: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'End date Commissioning Date filter' })
  endDate: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean, description: 'Grid Interconnection' })
  grid_interconnection: boolean;

  @IsOptional()
  @ApiPropertyOptional({ type: OffTaker, description: 'Off-taker' })
  off_taker: OffTaker;

  @IsOptional()
  @ApiPropertyOptional({ type: Sector, description: 'Off-takers sectors' })
  sector: Sector;

  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Labels' })
  labels: string;

  @IsOptional()
  @ApiPropertyOptional({
    type: StandardCompliance,
    description: 'Standard Compliance',
  })
  standard_compliance: StandardCompliance;

  // Region?
}
