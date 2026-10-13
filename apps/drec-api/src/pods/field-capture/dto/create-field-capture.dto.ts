import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SerialSource } from '../field-capture.entity';

/**
 * The device fields an operator fills on the capture screen. Everything else a
 * device needs is either the reviewer's job or inherited from the group, so
 * this stays short enough for one thumb-reachable screen.
 */
export class FieldCapturePayloadDTO {
  @ApiPropertyOptional({
    description:
      'Installed AC nameplate capacity in kW. The portal is kW throughout; ' +
      'do not send MW.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.000001, { message: 'Capacity must be greater than 0' })
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Installed DC nameplate capacity in kWp',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.000001, { message: 'DC capacity must be greater than 0' })
  dcCapacity?: number;

  @ApiPropertyOptional({ description: 'Commissioning date, ISO 8601' })
  @IsOptional()
  @IsISO8601()
  commissioningDate?: string;

  @ApiPropertyOptional({ description: 'Fuel code, e.g. ES100' })
  @IsOptional()
  @IsString()
  fuelCode?: string;

  @ApiPropertyOptional({ description: 'Device type code, e.g. TC110' })
  @IsOptional()
  @IsString()
  deviceTypeCode?: string;

  @ApiPropertyOptional({
    description:
      'Proposed site name. Unique platform-wide, so it is checked at submit ' +
      'and again at approval.',
  })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-3 country code' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Free-text note from the operator, shown to the reviewer',
  })
  @IsOptional()
  @IsString()
  operatorNote?: string;
}

export class CreateFieldCaptureDTO {
  @ApiProperty({
    description:
      'Idempotency key generated on the device before the first upload ' +
      'attempt. Re-POSTing the same key returns the stored capture instead ' +
      'of creating a second one.',
  })
  @IsUUID()
  clientCaptureId: string;

  @ApiProperty({ description: 'Serial as submitted, after any correction' })
  @IsString()
  @IsNotEmpty({ message: 'A serial number is required' })
  serialNumber: string;

  @ApiPropertyOptional({
    description: 'Raw reader output before the operator corrected it',
  })
  @IsOptional()
  @IsString()
  serialRaw?: string;

  @ApiProperty({ enum: SerialSource })
  @IsEnum(SerialSource)
  serialSource: SerialSource;

  @ApiPropertyOptional({
    description:
      'Agreement across the OCR burst, 0-1. Omit for barcode/manual.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  ocrConfidence?: number;

  @ApiProperty()
  @IsLatitude({ message: 'Latitude should be a number from -90 to +90.' })
  latitude: string;

  @ApiProperty()
  @IsLongitude({ message: 'Longitude should be a number from -180 to +180.' })
  longitude: string;

  @ApiPropertyOptional({
    description: 'GeolocationCoordinates.accuracy, in metres',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gpsAccuracyM?: number;

  @ApiPropertyOptional({
    description: 'When the photo was taken on the device',
  })
  @IsOptional()
  @IsISO8601()
  capturedAt?: string;

  @ApiPropertyOptional({ type: FieldCapturePayloadDTO })
  @IsOptional()
  @IsObject()
  payload?: FieldCapturePayloadDTO;
}

/**
 * Multipart wrapper. The phone sends the photo as a file part and the capture
 * as a JSON string part; `capture` must carry a class-validator decorator or
 * the global whitelisting ValidationPipe deletes it and the handler sees an
 * empty body — the failure mode that broke device registration for a month.
 */
export class FieldCaptureBody {
  @ApiPropertyOptional({
    description: 'CreateFieldCaptureDTO as a JSON string (multipart requests)',
  })
  @IsOptional()
  @IsString()
  capture?: string;
}
