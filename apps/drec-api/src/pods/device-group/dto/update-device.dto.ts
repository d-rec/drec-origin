import {
  Allow,
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

  // @Allow() rather than a type rule: validateDeviceGroupToRegister() does
  // the real checking and accepts a numeric string. Some decorator is
  // mandatory -- `whitelist: true` deletes an undecorated field silently.
  @ApiProperty({ type: Number })
  @Allow()
  targetCapacityInMegaWattHour: number;

  // @ApiProperty({ type: Date })
  // reservationStartDate:Date;

  @ApiProperty({ type: Date })
  @Allow()
  reservationEndDate: Date;

  @ApiProperty({ type: Boolean })
  @Allow()
  authorityToExceed: boolean;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  reservationExpiryDate: Date;
  // @ApiProperty()
  // @IsEnum(CertificateGenerationFrequency)
  // frequency:CertificateGenerationFrequency;
}

export class EndReservationDateDTO {
  @ApiProperty()
  @IsDate()
  endresavationdate: Date;
}
