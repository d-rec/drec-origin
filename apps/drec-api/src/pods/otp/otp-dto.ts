import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OtpDTO {
  @ApiProperty({ type: String })
  @IsString()
  code?: string;
}
