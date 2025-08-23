import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { CertificateGenerationFrequency } from '../../../utils/enums';
import { GroupType } from 'src/utils/enums/group-type.enum';

export class AddGroupDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @Min(1, { each: true })
  deviceIds: number[];

  @ApiProperty({ type: Number })
  targetCapacityInMegaWattHour: number;

  @ApiProperty({ type: Date })
  reservationStartDate: Date;

  @ApiProperty({ type: Date })
  reservationEndDate: Date;

  @ApiProperty({ type: Boolean })
  continueWithReservationIfOneOrMoreDevicesUnavailableForReservation: boolean;

  @ApiProperty({ type: Boolean })
  continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration: boolean;

  @ApiProperty({ type: Boolean })
  authorityToExceed: boolean;

  @ApiProperty()
  @IsEnum(CertificateGenerationFrequency)
  frequency: CertificateGenerationFrequency;

  // @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  blockchainAddress?: string;

  api_user_id?: string;

  @ApiPropertyOptional({ type: Date })
  reservationExpiryDate: Date;

  @ApiProperty({ type: String })
  @IsEnum(GroupType)
  type: GroupType;
}
