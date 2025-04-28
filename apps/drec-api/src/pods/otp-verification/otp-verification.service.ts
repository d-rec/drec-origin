import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { OtpVerification } from './otp-verification.entity';
import { sendSms } from '../../lib/aws';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async checkOtpValidity(
    phoneNumber: string,
    otp: string,
  ): Promise<boolean> {
    const otpRecord = await this.otpRepository.findOne({
      where: { phoneNumber, otp },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord || Date.now() > otpRecord.expirationTime) {
      return false;
    }
    return true;
  }

  async sendOtp(phoneNumber: string): Promise<{ message: string }> {
    const formatted = phoneNumber.replace(/\s+/g, '');
    const otp = this.generateOtp();
    const message = `Use code ${otp} to verify your D-REC account. Expires in 10 minutes`;
    try {
      await sendSms({ phoneNumber: formatted, message });

      const expirationTime = Date.now() + 10 * 60 * 1000;
      await this.otpRepository.save({
        phoneNumber: formatted,
        otp,
        expirationTime,
      });
      return { message: 'OTP sent via message.' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP via SMS');
    }
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<{ message: string }> {
    const isValidOtp = await this.checkOtpValidity(phoneNumber, otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP or OTP has expired.');
    }
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new ConflictException('User not found.');
    }
    user.phoneNumberVerifiedAt = new Date();
    await this.userRepository.save(user);
    return { message: 'Phone number verified successfully.' };
  }
}
