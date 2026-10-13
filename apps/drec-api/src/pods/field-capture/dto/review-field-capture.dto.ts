import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { FieldCapturePayloadDTO } from './create-field-capture.dto';

export class ApproveFieldCaptureDTO {
  @ApiPropertyOptional({
    description:
      'Corrected serial. Set when the reviewer can read the nameplate photo ' +
      'better than the scanner did.',
  })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({
    type: FieldCapturePayloadDTO,
    description:
      'Field overrides merged over the submitted payload at approval time.',
  })
  @IsOptional()
  @IsObject()
  payload?: FieldCapturePayloadDTO;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNote?: string;
}

export class RejectFieldCaptureDTO {
  @ApiProperty({
    description:
      'Why it was rejected. Required — the operator has to know what to redo ' +
      'before walking back to the site.',
  })
  @IsString()
  @IsNotEmpty({ message: 'A rejection reason is required' })
  @MaxLength(2000)
  reviewNote: string;
}
