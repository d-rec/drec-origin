import {
  IsString,
  IsInt,
  Min,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IDeviceGroup } from '../../../models';
import {
  StandardCompliance,
  OffTaker,
  Installation,
  Sector,
  CapacityRange,
  CommissioningDateRange,
} from '../../../utils/enums';

export class NewDeviceGroupDTO
  implements Omit<IDeviceGroup, 'id' | 'organizationId'>
{
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @Min(1, { each: true })
  deviceIds: number[];

  @ApiProperty()
  @IsString()
  countryCode: string;

  @ApiProperty()
  @IsString()
  fuelCode: string;

  @ApiProperty()
  @IsEnum(StandardCompliance)
  standardCompliance: StandardCompliance;

  @ApiProperty({ type: [String] })
  @IsArray()
  deviceTypeCodes: string[];

  @ApiProperty({
    description: 'List of off takers',
    isArray: true,
    enum: OffTaker,
  })
  @IsEnum(OffTaker, { each: true })
  @IsNotEmpty()
  offTakers: OffTaker[];

  @ApiProperty({
    description: 'List of installations',
    isArray: true,
    enum: Installation,
  })
  @IsEnum(Installation, { each: true })
  @IsNotEmpty()
  installationConfigurations: Installation[];

  @ApiProperty({
    description: 'List of sectors',
    isArray: true,
    enum: Sector,
  })
  @IsEnum(Sector, { each: true })
  @IsNotEmpty()
  sectors: Sector[];

  @ApiProperty()
  @IsBoolean()
  gridInterconnection: boolean;

  @ApiProperty()
  @IsNumber()
  aggregatedCapacity: number;

  @ApiProperty()
  @IsEnum(CapacityRange)
  capacityRange: CapacityRange;

  @ApiProperty({
    description: 'List of commissioning date ranges',
    isArray: true,
    enum: CommissioningDateRange,
  })
  @IsEnum(CommissioningDateRange, { each: true })
  @IsNotEmpty()
  commissioningDateRange: CommissioningDateRange[];

  @ApiProperty({ default: 1000 })
  @IsNumber()
  @IsOptional()
  yieldValue: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  labels: string[];
}
