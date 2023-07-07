import { IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';


import { IsNotEmpty, IsString } from 'class-validator';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
  FuelCode,
  DevicetypeCode,
  SDGBenefitsList
} from '../../../utils/enums';

export class FilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: FuelCode, description: 'Fuel Code', enum: FuelCode })
  fuelCode: FuelCode;

  @IsOptional()
  @ApiPropertyOptional({ type: DevicetypeCode, description: 'Device Type Code', enum: DevicetypeCode })
  deviceTypeCode: DevicetypeCode;

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
    isArray: true
  })
  SDGBenefits?: string[] | undefined;

}

export class GroupIDBasedFilteringDTO {

  @IsOptional()
  @ApiPropertyOptional({ description: 'Group Id' })
  groupId: string;


}

export class AmountFormattingDTO {

  @ApiProperty({ type: String })
  @IsString()
  amount: string;


}
