import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { OtpVerificationService } from './otp-verification.service';
import { OtpVerificationController } from './otp-verification.contoller';
import { OtpVerification } from './otp-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OtpVerification])],
  controllers: [OtpVerificationController],
  providers: [OtpVerificationService],
  exports: [OtpVerificationService],
})
export class OtpVerificationModule {}
