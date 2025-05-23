import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { Otp } from './otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Otp])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
