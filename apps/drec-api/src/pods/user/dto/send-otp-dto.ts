import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDTO {
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  otp?: string;
}
