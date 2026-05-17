import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsISO8601, IsOptional } from 'class-validator';

/**
 * Admin "repair stranded mints" — finds reads that look minted (mr.certified=true
 * AND a Requested row in check_certificate_issue_date_log_for_device) but have
 * no matching token in certificate_read_model.metadata.deviceIds, then resets
 * them and re-fires the late-ongoing pipeline so the issuer can retry.
 *
 * Built after a series of half-finished mints on prod where the issuance
 * pipeline updated DB state as if the mint had succeeded but the actual
 * on-chain certificate was never created. Without this endpoint, the issuer's
 * idempotency check sees the cert log "Requested" row, skips the read, and
 * the token never lands.
 */
export class RepairStrandedMintsDTO {
  @ApiProperty({
    type: Number,
    description: 'Target device_group.id to repair',
  })
  @IsInt()
  groupId: number;

  @ApiPropertyOptional({
    type: String,
    description:
      'Only consider reads with start_date >= this ISO8601 timestamp. Defaults to 2025-01-01.',
  })
  @IsOptional()
  @IsISO8601()
  startDateMin?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'When true, return the stranded-read list without writing any DB changes or queuing issuance.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
