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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IDeviceGroup } from '../../../models';
import {
  StandardCompliance,
  OffTaker,
  Installation,
  Sector,
  CapacityRange,
  CommissioningDateRange,
} from '../../../utils/enums';
import { Exclude } from 'class-transformer';
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

  @ApiProperty({ type: [String] })
  @IsArray()
  countryCode: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  fuelCode: string[];

  // @ApiProperty()
  // @IsEnum(StandardCompliance)
  // standardCompliance: StandardCompliance;

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

  // @ApiProperty({
  //   description: 'List of installations',
  //   isArray: true,
  //   enum: Installation,
  // })
  // @IsEnum(Installation, { each: true })
  // @IsNotEmpty()
  // installationConfigurations: Installation[];

  // @ApiProperty({
  //   description: 'List of sectors',
  //   isArray: true,
  //   enum: Sector,
  // })
  // @IsEnum(Sector, { each: true })
  // @IsNotEmpty()
  // sectors: Sector[];

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

  // @ApiProperty({ default: 1000 })
  // @IsNumber()
  // @IsOptional()
  // yieldValue: number;

  // @ApiProperty({ type: [String] })
  // @IsArray()
  // @IsOptional()
  // labels: string[];

  @ApiProperty({ type: String })
  @IsOptional()
  frequency?: string;

  @ApiProperty({ type: Date })
  @IsOptional()
  reservationStartDate?: Date;

  @ApiProperty({ type: Date })
  @IsOptional()
  reservationEndDate?: Date;

  @ApiProperty({ type: Number })
  @IsOptional()
  targetVolumeInMegaWattHour?: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  targetVolumeCertificateGenerationSucceededInMegaWattHour?: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  targetVolumeCertificateGenerationRequestedInMegaWattHour?: number;

  @ApiProperty({ type: Number })
  @IsOptional()
  targetVolumeCertificateGenerationFailedInMegaWattHour?: number;

  @ApiProperty({ type: Boolean })
  @IsOptional()
  authorityToExceed?: boolean;

  @ApiProperty({ type: Number })
  @IsOptional()
  buyerId?: number;

  @ApiProperty({ type: String })
  @IsOptional()
  buyerAddress?: string | null | undefined;

  @ApiProperty({ type: String })
  @IsOptional()
  devicegroup_uid?: string | null | undefined;

  @ApiProperty({ type: [Number] })
  @Exclude()
  @IsInt({ each: true })
  @Min(1, { each: true })
  deviceIdsInt?: number[];

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  reservationExpiryDate?: Date;
  // @ApiProperty({ type: String })
  // @IsOptional()
  // type?: string;
}
