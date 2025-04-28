import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { OtpService } from './otp-verification.service';
import { OtpController } from './otp.contoller';
import { OtpVerification } from './otp-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OtpVerification])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
