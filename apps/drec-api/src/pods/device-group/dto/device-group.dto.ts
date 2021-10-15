import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IDevice, IDeviceGroup } from '../../../models';
import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../../utils/enums';
import { DeviceDTO } from '../../device/dto';

export class DeviceGroupDTO implements IDeviceGroup {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  organizationId: number;

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

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  yieldValue: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  labels: string[];

  @ApiPropertyOptional({ type: [DeviceDTO] })
  @IsArray()
  @IsOptional()
  devices?: IDevice[];
}
