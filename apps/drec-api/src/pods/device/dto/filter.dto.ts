import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../../utils/enums';

export class FilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Fuel Code' })
  fuelCode: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Device Type Code' })
  deviceTypeCode: string;

  @IsOptional()
  @ApiPropertyOptional({
    type: Installation,
    description: 'Installation configuration',
  })
  installationConfiguration: Installation;

  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'Search number for capacity',
  })
  capacity: number;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Start date Commissioning Date filter' })
  start_date: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'End date Commissioning Date filter' })
  end_date: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean, description: 'Grid Interconnection' })
  gridInterconnection: boolean;

  @IsOptional()
  @ApiPropertyOptional({ type: OffTaker, description: 'Off-taker' })
  offTaker: OffTaker;

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
  standardCompliance: StandardCompliance;

  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Country' })
  country: string;
}
