import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Otp } from './otp.entity';
import { sendSms } from '../../lib/aws';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  private generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async checkValidity(
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    const otpRecord = await this.otpRepository.findOne({
      where: { phoneNumber, code },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord || Date.now() > otpRecord.expirationTime) {
      return false;
    }
    return true;
  }

  async send(phoneNumber: string): Promise<{ message: string }> {
    const formatted = phoneNumber.replace(/\s+/g, '');
    const code = this.generate();
    const message = `Use code ${code} to verify your D-REC account. Expires in 10 minutes`;
    try {
      await sendSms({ phoneNumber: formatted, message });

      const expirationTime = Date.now() + 10 * 60 * 1000;
      await this.otpRepository.save({
        phoneNumber: formatted,
        code,
        expirationTime,
      });
      return { message: 'OTP sent via message.' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP via SMS');
    }
  }

  async verify(
    phoneNumber: string,
    code: string,
  ): Promise<{ message: string }> {
    const isValidOtp = await this.checkValidity(phoneNumber, code);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP or OTP has expired.');
    }
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new ConflictException('User not found.');
    }
    if (user.phoneNumberVerifiedAt)
      return { message: 'user already verified.' };
    user.phoneNumberVerifiedAt = new Date();
    await this.userRepository.save(user);
    return { message: 'Phone number verified successfully.' };
  }
}
