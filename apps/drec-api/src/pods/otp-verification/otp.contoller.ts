import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OtpService } from './otp-verification.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtpDTO } from './send-otp-dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send-otp')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']))
  @ApiOperation({
    summary: 'Send OTP to Phone Number',
    description:
      'Sends a One-Time Password (OTP) to the provided phone number.',
  })
  @ApiBody({
    type: OtpDTO,
    description: 'Phone number payload required to send OTP',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'OTP sent successfully to the provided phone number.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided phone number is invalid or missing.',
  })
  @ApiBody({ type: OtpDTO })
  async sendOtp(@Req() req: any): Promise<{ message: string }> {
    const phoneNumber = req.user?.phoneNumber;
    return this.otpService.send(phoneNumber);
  }

  @Post('verify-otp')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']))
  @ApiOperation({
    summary: 'Verify OTP Code',
    description:
      'Verifies the OTP code provided for a specific phone number. Used to confirm phone number ownership.',
  })
  @ApiBody({
    type: OtpDTO,
    description:
      'Payload must include the phone number and OTP code for verification.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully and phone number is confirmed.',
    schema: {
      example: {
        message: 'Phone number verified successfully.',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request. Invalid or expired OTP code provided.',
  })
  @ApiBody({ type: OtpDTO })
  async verifyOtp(
    @Req() req: any,
    @Body('otp') otp: string,
  ): Promise<{ message: string }> {
    const phoneNumber = req.user?.phoneNumber;
    return this.otpService.verify(phoneNumber, otp);
  }
}
