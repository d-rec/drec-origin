import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Admin manual reissue. Targets a specific reservation (groupId) plus a list of
 * device externalIds, and re-runs the issuance pipeline over a date window —
 * intended for cleanup after the endReservation cascade prematurely unlinked
 * devices, leaving in-window reads unminted. Idempotent: skips devices that
 * already have a certificate log entry covering the target window.
 */
export class ReissueCertificateDTO {
  @ApiProperty({ type: Number, description: 'Target device_group.id' })
  @IsInt()
  groupId: number;

  @ApiProperty({
    type: [String],
    description: 'externalIds of devices whose reads should be reissued',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  externalIds: string[];

  @ApiPropertyOptional({
    type: String,
    description:
      'Window start (ISO8601). Defaults to group.reservationStartDate.',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Window end (ISO8601). Defaults to group.reservationEndDate.',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'When true, report what would happen without writing certificates or DB log rows.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'When true, bypass the hasIssuedForDeviceInWindow idempotency guard and ' +
      'reissue even if a per-device certificate-log row overlaps the window. For ' +
      '"phantom" cycles where the log says issued but no certificate was minted. ' +
      'Use only after confirming no real certificate exists for the window.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
