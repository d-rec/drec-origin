import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OtpService } from './otp.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtpDTO } from './otp-dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
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
  async send(@Req() request: Request): Promise<{ message: string }> {
    const phoneNumber = (request.user as any).phoneNumber;
    return this.otpService.send(phoneNumber);
  }

  @Post('verify')
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
  async verify(
    @Req() request: Request,
    @Body('code') code: string,
  ): Promise<{ message: string }> {
    const phoneNumber = (request.user as any).phoneNumber;
    return this.otpService.verify(phoneNumber, code);
  }
}
