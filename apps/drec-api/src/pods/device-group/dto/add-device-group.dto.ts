import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  IsInt,
  IsString,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';
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

  // @Allow() here, not @IsNumber(): the real rule lives in
  // validateDeviceGroupToRegister() (src/validations/device-group.ts), which
  // accepts a numeric string as well as a number and reports a far better
  // message. Without SOME decorator the pipe's `whitelist: true` deletes the
  // field outright -- that is what broke reservation creation between
  // 2026-09-16 and 2026-10-12. Do not narrow the accepted types here; API
  // clients have been sending strings to this endpoint for years.
  @ApiProperty({ type: Number })
  @Allow()
  targetCapacityInMegaWattHour: number;

  // Accepted as a strict-UTC string and converted by
  // validateDeviceGroupToRegister(); @IsDate() would reject that string.
  @ApiProperty({ type: Date })
  @Allow()
  reservationStartDate: Date;

  @ApiProperty({ type: Date })
  @Allow()
  reservationEndDate: Date;

  @ApiProperty({ type: Boolean })
  @Allow()
  continueWithReservationIfOneOrMoreDevicesUnavailableForReservation: boolean;

  @ApiProperty({ type: Boolean })
  @Allow()
  continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration: boolean;

  @ApiProperty({ type: Boolean })
  @Allow()
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
  @Allow()
  reservationExpiryDate: Date;

  @ApiProperty({ type: String })
  @IsEnum(GroupType)
  type: GroupType;
}
