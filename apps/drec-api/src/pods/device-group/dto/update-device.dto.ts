import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeviceGroupDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
export class NewUpdateDeviceGroupDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: Number })
  targetCapacityInMegaWattHour: number;

  // @ApiProperty({ type: Date })
  // reservationStartDate:Date;

  @ApiProperty({ type: Date })
  reservationEndDate: Date;

  @ApiProperty({ type: Boolean })
  authorityToExceed: boolean;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  reservationExpiryDate: Date;
  // @ApiProperty()
  // @IsEnum(BuyerReservationCertificateGenerationFrequency)
  // frequency:BuyerReservationCertificateGenerationFrequency;
}

export class EndReservationdateDTO {
  @ApiProperty()
  @IsDate()
  endresavationdate: Date;
}
