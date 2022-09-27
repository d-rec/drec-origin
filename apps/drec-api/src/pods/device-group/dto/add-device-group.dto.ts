import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min,IsBoolean,IsEnum } from 'class-validator';
import { BuyerReservationCertificateGenerationFrequency } from '../../../models';

export class AddGroupDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @Min(1, { each: true })
  deviceIds: number[];

  @ApiProperty({ type: Number })
  targetCapacityInMegaWattHour:number;

  
  @ApiProperty({ type: Date })
  reservationStartDate:Date;

  
  @ApiProperty({ type: Date })
  reservationEndDate:Date;

  @ApiProperty({ type: Boolean })
  continueWithReservationIfOneOrMoreDevicesUnavailableForReservation:boolean;

  @ApiProperty({ type: Boolean })
  continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration:boolean;

  @ApiProperty({ type: Boolean })
  authorityToExceed:boolean;

  @ApiProperty()
  @IsEnum(BuyerReservationCertificateGenerationFrequency)
  frequency:BuyerReservationCertificateGenerationFrequency;
}
