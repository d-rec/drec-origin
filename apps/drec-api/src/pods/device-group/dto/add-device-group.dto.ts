import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { CertificateGenerationFrequency } from '../../../utils/enums';
import { GroupType } from '../../../utils/enums/group-type.enum';

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

  // DELIBERATELY UNDECORATED. The global pipe's `whitelist: true` strips
  // any body property without a decorator, which is exactly what we want
  // here: this field is server-assigned from the authenticated user in
  // BuyerReservationController.createOne/updateOne, after validation runs.
  // Decorating it would let a client set someone else's api_user_id.
  api_user_id?: string;

  @ApiPropertyOptional({ type: Date })
  reservationExpiryDate: Date;

  @ApiProperty({ type: String })
  @IsEnum(GroupType)
  type: GroupType;
}
