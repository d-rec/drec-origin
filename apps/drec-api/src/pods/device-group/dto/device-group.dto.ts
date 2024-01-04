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
import { IDeviceGroup } from '../../../models';
import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../../utils/enums';
import { DeviceDTO } from '../../device/dto';
import { OrganizationDTO } from '../../organization/dto';

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

 

// @ApiProperty({ type: [String] })
//   @IsArray()
//   @IsOptional()
//   labels: string[];

  @ApiPropertyOptional({ type: [DeviceDTO] })
  @IsArray()
  @IsOptional()
  devices?: DeviceDTO[];

  @ApiPropertyOptional({ type: OrganizationDTO })
  @IsOptional()
  organization?: Pick<OrganizationDTO, 'name'>;

  @ApiProperty({ type: String })
  @IsOptional()
  frequency?: string | null;

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


  @ApiProperty()
  @IsOptional()
  leftoverReadsByCountryCode?: any;


  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  buyerId!: number | null;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  buyerAddress!: string | null;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  leftoverReads: number;

  @IsBoolean()
  reservationActive?: boolean;
  
  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  reservationExpiryDate:Date;
}

export class CSVBulkUploadDTO {
  @ApiProperty()
  @IsString()
  fileName: string;
}


export class ResponseDeviceGroupDTO extends DeviceGroupDTO
{
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  unavailableDeviceIDsDueToCertificatesAlreadyCreatedInDateRange?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  unavailableDeviceIDsDueToAreIncludedInBuyerReservation?: string;
}